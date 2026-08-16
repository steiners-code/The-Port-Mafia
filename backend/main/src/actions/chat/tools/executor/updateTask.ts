import { MainTaskLevel, MainTaskStatus } from "../../../../generated/prisma";
import { MainTask, Question } from "../../../../lib/types";
import { JsonValue } from "@prisma/client/runtime/client";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";

const TASK_LEVELS = [
    MainTaskLevel.CRITICAL,
    MainTaskLevel.HIGH,
    MainTaskLevel.MEDIUM,
    MainTaskLevel.LOW,
] as const;

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

export async function updateTask(args: { id: string; level?: string; comment?: string; content?: JsonValue }, { userId }: ToolContext) {
    if (!args.level && !args.comment && !args.content) {
        return {
            success: false,
            message: "At least one of level, comment, or content is required to make a change.",
        };
    }

    if (args.level && !isValidLevel(args.level)) {
        return {
            success: false,
            message: `The provided level "${args.level}" is invalid. Valid values are: ${TASK_LEVELS.join(" | ")}.`,
        };
    }

    const task = await prisma.mainTask.findUnique({ where: { id: args.id, userId } });

    /**
     * Ownership check: findUnique by id alone would let this tool touch
     * any user's task regardless of who's calling it. userId comes from
     * ToolContext, tied to the actual authenticated conversation, and
     * must match the task's own userId before anything below runs.
     */
    if (!task) {
        return {
            success: false,
            message: "Task not found.",
        };
    }

    let newContent: MainTask["content"] = task.content as MainTask["content"];

    /**
     * Set only when this update leaves every item in the content fully
     * answered — moves the task to INREVIEW so the human can check what's
     * being stated about them before it goes anywhere further. Left
     * undefined (i.e. status untouched) on a partial answer; this never
     * downgrades a status, only promotes on full completion.
     */
    let nextStatus: MainTaskStatus | undefined;

    if (args.content) {
        switch (task.type) {
            case "QUESTIONNAIRE":
                if (!isQuestionnaireContentInput(args.content)) {
                    return {
                        success: false,
                        message: "Invalid content for a QUESTIONNAIRE task. Expected a non-empty array of { index: number, answer: string }.",
                    };
                }

                const existing = task.content as Question[];
                const existingIndices = new Set(existing.map((q) => q.index));

                for (const item of args.content) {
                    if (!existingIndices.has(item.index)) {
                        return {
                            success: false,
                            message: `No question with index ${item.index} exists on this task.`,
                        };
                    }
                }

                newContent = existing.map((q) => {
                    const update = (args.content as ContentAnswerInput[]).find((c) => c.index === q.index);
                    if (!update) return q;
                    return { ...q, answer: update.answer, answeredBy: "DAZAI" as const };
                });

                const isFullyAnswered = newContent.every((q) => q.answer !== null);
                if (isFullyAnswered) nextStatus = MainTaskStatus.INREVIEW;
                break;

            default:
                return {
                    success: false,
                    message: `Unsupported task type "${task.type}".`,
                };
        }
    }

    const updated = await prisma.mainTask.update({
        where: { id: task.id },
        data: {
            ...(args.level && { level: args.level as MainTaskLevel }),
            ...(args.content && { content: newContent }),
            ...(nextStatus && { status: nextStatus }),
            ...(args.comment && {
                comments: { create: { content: args.comment } },
            }),
        },
        select: { id: true, level: true, status: true, content: true },
    });

    return {
        success: true,
        message: "Task has been successfully updated!",
        task: updated,
    };
}