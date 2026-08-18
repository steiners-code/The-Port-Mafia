import { reportTaskCompletionToSubAgent } from "../../../tasks/reportTaskCompletionToSubAgent";
import { MainTaskLevel, MainTaskStatus, SubAgent } from "../../../../generated/prisma";
import { MainTask, Question } from "../../../../lib/types";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";

const TASK_LEVELS = [
    MainTaskLevel.CRITICAL,
    MainTaskLevel.HIGH,
    MainTaskLevel.MEDIUM,
    MainTaskLevel.LOW,
] as const;

/**
 * Only truly terminal states are blocked. INREVIEW is deliberately NOT
 * here — that's exactly the state this tool needs to keep working from,
 * since it's Dazai submitting cleaned-up answers after Ningen Shikaku
 * that moves a task out of INREVIEW in the first place.
 */
const CLOSED_STATUSES: MainTaskStatus[] = [
    MainTaskStatus.COMPLETED,
    // MainTaskStatus.DISCARDED,
    MainTaskStatus.CANCELLED,
];

function isValidLevel(value: string): value is MainTaskLevel {
    return (TASK_LEVELS as readonly string[]).includes(value);
}

type ContentAnswerInput = { index: number; answer: string };

function isQuestionnaireContentInput(value: unknown): value is ContentAnswerInput[] {
    return (
        Array.isArray(value) &&
        value.length > 0 &&
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

type UpdateTaskArgs = {
    id: string;
    level?: string;
    comment?: string;
    questionnaireAnswers?: ContentAnswerInput[];
    accountPerformance?: unknown;
    postPerformance?: unknown;
};

export async function updateTask(args: UpdateTaskArgs, { userId }: ToolContext) {
    const changes: string[] = [];

    const hasAnyChange = args.level || args.comment || args.questionnaireAnswers || args.accountPerformance || args.postPerformance;

    if (!hasAnyChange) {
        throw new Error("At least one of level, comment, questionnaireAnswers, accountPerformance, or postPerformance is required to make a change.");
    }

    if (args.level && !isValidLevel(args.level)) {
        throw new Error(`The provided level "${args.level}" is invalid. Valid values are: ${TASK_LEVELS.join(" | ")}.`);
    }

    const task = await prisma.mainTask.findUnique({ where: { id: args.id, userId } });

    /**
     * Ownership check: findUnique by id alone would let this tool touch
     * any user's task regardless of who's calling it. userId comes from
     * ToolContext, tied to the actual authenticated conversation, and
     * must match the task's own userId before anything below runs.
     */
    if (!task) {
        throw new Error("Task not found.");
    }

    if (CLOSED_STATUSES.includes(task.status)) {
        throw new Error(`This task is already ${task.status.toLowerCase()} and can no longer be updated.`);
    }

    let newContent: MainTask["content"] = task.content as MainTask["content"];

    /**
     * Set only when this update leaves every item in the content fully
     * answered. Where it lands depends on how the task got here:
     * INREVIEW means it already went through Ningen Shikaku (human
     * answered, Dazai was asked to clean it up) — full completion here
     * means it's actually done, so it promotes to COMPLETED and gets
     * reported back to the sub-agent that raised it. Fully answered from
     * any other status moves it to INREVIEW so the human can check what's
     * being stated about them before it goes anywhere further. Left
     * undefined (i.e. status untouched) on a partial answer; this never
     * downgrades a status, only promotes on full completion.
     */
    let nextStatus: MainTaskStatus | undefined;

    const contentProvided = Boolean(args.questionnaireAnswers || args.accountPerformance || args.postPerformance);

    if (contentProvided) {
        switch (task.type) {
            case "QUESTIONNAIRE": {
                if (args.accountPerformance || args.postPerformance) {
                    throw new Error("This task is of type QUESTIONNAIRE — submit questionnaireAnswers, not accountPerformance or postPerformance.");
                }

                if (!isQuestionnaireContentInput(args.questionnaireAnswers)) {
                    throw new Error("Invalid questionnaireAnswers. Expected a non-empty array of { index: number, answer: string }.");
                }

                const existing = task.content as Question[];
                const existingIndices = new Set(existing.map((q) => q.index));

                for (const item of args.questionnaireAnswers) {
                    if (!existingIndices.has(item.index)) {
                        throw new Error(`No question with index ${item.index} exists on this task.`);
                    }
                }

                newContent = existing.map((q) => {
                    const update = args.questionnaireAnswers!.find((c) => c.index === q.index);
                    if (!update) return q;
                    return { ...q, answer: update.answer, answeredBy: "DAZAI" as const };
                });

                const isFullyAnswered = newContent.every((q) => q.answer !== null);
                if (isFullyAnswered) {
                    nextStatus = task.status === MainTaskStatus.INREVIEW
                        ? MainTaskStatus.COMPLETED
                        : MainTaskStatus.INREVIEW;
                }

                const answeredCount = args.questionnaireAnswers.length;
                changes.push(`${answeredCount} question${answeredCount === 1 ? "" : "s"} answered.`);
                break;
            }

            /**
             * ACCOUNT_PERFORMANCE and POST_PERFORMANCE aren't implemented
             * yet — falls through here too if a QUESTIONNAIRE task somehow
             * reaches this switch with neither branch matched, and for any
             * other task type until its case is added.
             */
            default:
                throw new Error(`Task type "${task.type}" isn't supported by update_task yet.`);
        }
    }

    const updated = await prisma.mainTask.update({
        where: { id: task.id },
        data: {
            ...(args.level && { level: args.level as MainTaskLevel }),
            ...(contentProvided && { content: newContent }),
            ...(nextStatus && { status: nextStatus }),
            ...(args.comment && {
                comments: { create: { content: args.comment } },
            }),
        },
        select: { id: true, level: true, status: true, content: true },
    });

    if (args.level) changes.push(`Level set to ${args.level}.`);
    if (args.comment) changes.push("Comment added.");

    if (nextStatus === MainTaskStatus.INREVIEW) {
        changes.push(`Task moved to INREVIEW — every question now has an answer.`);
    }

    /**
     * This tool runs as the AI, so the outbound call needs the actual
     * user's id carried explicitly — it's not implicit the way an
     * in-browser fetch would have a session cookie. userId here comes
     * from ToolContext, tied to the real authenticated conversation.
     */
    if (nextStatus === MainTaskStatus.COMPLETED) {
        await reportTaskCompletionToSubAgent(userId, {
            ...updated,
            subAgent: task.subAgent,
            subAgentRole: task.subAgentRole,
            subAgentPlatform: task.subAgentPlatform,
        } as MainTask);
        changes.push(`Task completed and reported back to ${task.subAgent}.`);
    }

    return {
        message: `${changes.join(" ")} This change is already saved. Do not call update_task again for this task unless you have something new to add.`,
        updatedTask: updated,
    };
}