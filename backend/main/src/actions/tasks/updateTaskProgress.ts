import { reportTaskCompletionToSubAgent } from "./reportTaskCompletionToSubAgent";
import { triggerDazaiNingenShikaku } from "../cron/triggerDazaiNingenShikaku";
import { MainTaskStatus, SubAgent } from "../../generated/prisma";
import { MainTask, Question } from "../../lib/types";
import { prisma } from "../../lib/db";
import { t } from "elysia";

/**
 * Body schema for POST /tasks/update/questionnaire. Mirrors
 * UpdateTaskProgressBody from updateTaskProgress.ts — kept in sync by
 * hand since Elysia/TypeBox schemas and TS types aren't automatically
 * derived from each other here.
 */
export const updateQuestionnaireBody = t.Object({
    taskId: t.String({ minLength: 1 }),
    action: t.Union([
        t.Literal("MarkComplete"),
        t.Literal("SaveProgress"),
        t.Literal("NingenShikaku"),
    ]),
    answers: t.Array(
        t.Object({
            index: t.Integer(),
            answer: t.String({ minLength: 1 }),
        })
    ),
})


const CLOSED_STATUSES: MainTaskStatus[] = [
    MainTaskStatus.COMPLETED,
    // MainTaskStatus.DISCARDED,
    MainTaskStatus.CANCELLED,
];

type AnswerInput = { index: number; answer: string };

function isValidAnswers(value: unknown): value is AnswerInput[] {
    return (
        Array.isArray(value) &&
        value.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as any).index === "number" &&
                typeof (item as any).answer === "string" &&
                (item as any).answer.trim().length > 0
        )
    );
}

type UpdateTaskProgressBody = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress" | "NingenShikaku";
    answers: AnswerInput[];
};

/**
 * User-facing counterpart to the AI's update_task tool. Same content-merge
 * shape, but answeredBy is USER here — this is the human filling the form
 * directly, not Dazai answering on their behalf. Action determines what
 * happens after the merge: SaveProgress just persists it, MarkComplete
 * requires full completion and reports the finished answers back to the
 * sub-agent that raised the task, NingenShikaku hands it to Dazai to
 * clean up before anything gets reported.
 */
export async function updateTaskProgress(userId: string, body: UpdateTaskProgressBody) {
    if (!["MarkComplete", "SaveProgress", "NingenShikaku"].includes(body.action)) {
        return {
            status: 400,
            success: false,
            message: `Invalid action "${body.action}".`,
        };
    }

    if (!isValidAnswers(body.answers)) {
        return {
            status: 400,
            success: false,
            message: "Invalid answers. Expected an array of { index: number, answer: string }.",
        };
    }

    const task = await prisma.mainTask.findUnique({ where: { id: body.taskId, userId } });

    if (!task) {
        return {
            status: 404,
            success: false,
            message: "Task not found.",
        };
    }

    if (CLOSED_STATUSES.includes(task.status)) {
        return {
            status: 400,
            success: false,
            message: `This task is already ${task.status.toLowerCase()} and can no longer be edited.`,
        };
    }

    /**
     * Only QUESTIONNAIRE implemented — same boundary as the AI's
     * update_task tool. Extend this switch when another task type lands.
     */
    if (task.type !== "QUESTIONNAIRE") {
        return {
            status: 400,
            success: false,
            message: `Task type "${task.type}" isn't supported yet.`,
        };
    }

    const existing = task.content as Question[];
    const existingIndices = new Set(existing.map((q) => q.index));

    for (const item of body.answers) {
        if (!existingIndices.has(item.index)) {
            return {
                status: 400,
                success: false,
                message: `No question with index ${item.index} exists on this task.`,
            };
        }
    }

    const mergedContent: Question[] = existing.map((q) => {
        const update = body.answers.find((a) => a.index === q.index);
        if (!update) return q;
        return { ...q, answer: update.answer, answeredBy: "USER" as const };
    });

    switch (body.action) {
        case "SaveProgress": {
            await prisma.mainTask.update({
                where: { id: task.id },
                data: {
                    content: mergedContent,
                    status: MainTaskStatus.INPROGRESS,
                },
            });

            return {
                status: 200,
                success: true,
                message: "Progress saved.",
            };
        }

        case "MarkComplete": {
            /**
             * MarkComplete via this human-facing route only ever runs from
             * PENDING or INPROGRESS. INREVIEW -> COMPLETED is a different
             * transition entirely — it happens through Dazai's own
             * update_task tool call after Ningen Shikaku, once he's
             * cleaned the answers up. Allowing this action to fire from
             * INREVIEW would let the user skip that review step outright.
             */
            if (task.status !== MainTaskStatus.PENDING && task.status !== MainTaskStatus.INPROGRESS) {
                return {
                    status: 400,
                    success: false,
                    message: task.status === MainTaskStatus.INREVIEW
                        ? "This task is with Dazai for review — it'll complete once he's done, not directly."
                        : `Can't mark this complete from status ${task.status}.`,
                };
            }

            const isFullyAnswered = mergedContent.every((q) => q.answer !== null);
            if (!isFullyAnswered) {
                return {
                    status: 400,
                    success: false,
                    message: "Not every question is answered yet — can't mark this complete.",
                };
            }

            const updated = await prisma.mainTask.update({
                where: { id: task.id },
                data: {
                    content: mergedContent,
                    status: MainTaskStatus.COMPLETED,
                },
            });

            await reportTaskCompletionToSubAgent({
                ...updated,
                content: mergedContent,
            } as MainTask & { id: string; subAgent: SubAgent });

            return {
                status: 200,
                success: true,
                message: "Marked complete and sent to Maha.",
            };
        }

        case "NingenShikaku": {
            /**
             * Blocked from INREVIEW — a task already sitting there means
             * Dazai's mid-review from a prior Ningen Shikaku call. Letting
             * this re-fire would send him a second, redundant review turn
             * for the same task, wasting a call for nothing.
             */
            if (task.status === MainTaskStatus.INREVIEW) {
                return {
                    status: 400,
                    success: false,
                    message: "This task is already with Dazai for review.",
                };
            }

            const updated = await prisma.mainTask.update({
                where: { id: task.id },
                data: {
                    content: mergedContent,
                    status: MainTaskStatus.INREVIEW,
                },
            });

            await triggerDazaiNingenShikaku(userId, {
                ...updated,
                content: mergedContent,
            } as MainTask & { id: string });

            return {
                status: 200,
                success: true,
                message: "Sent to Dazai for review.",
            };
        }
    }
}