import { reportTaskCompletionToSubAgent } from "./reportTaskCompletionToSubAgent";
import { MainTask, AccountSnapshot } from "../../lib/types";
import { MainTaskStatus } from "../../generated/prisma";
import { prisma } from "../../lib/db";
import { t } from "elysia";

/**
 * Body schema for POST /tasks/update/questionnaire. Mirrors
 * UpdateTaskProgressBody from updateTaskProgress.ts — kept in sync by
 * hand since Elysia/TypeBox schemas and TS types aren't automatically
 * derived from each other here.
 */
export const updateAccountSnapshotBody = t.Object({
    taskId: t.String({ minLength: 1 }),
    action: t.Union([
        t.Literal("MarkComplete"),
        t.Literal("SaveProgress"),
    ]),
    data: t.Object({
        connectionsTotal: t.Number(),
        followersTotal: t.Number(),
        date: t.String({ minLength: 1 }),
    })
})

const CLOSED_STATUSES: MainTaskStatus[] = [
    MainTaskStatus.COMPLETED,
    // MainTaskStatus.DISCARDED,
    MainTaskStatus.CANCELLED,
];

type AccountSnapshotInput = {
    date: string,
    connectionsTotal: number,
    followersTotal: number,
};

function isValidData(value: unknown): value is AccountSnapshotInput {
    return (
        Array.isArray(value) &&
        value.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as any).date === "string" &&
                typeof (item as any).connectionsTotal === "number" &&
                typeof (item as any).followersTotal === "number"
        )
    );
}

export type updateAccountSnapshotTaskBody = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress";
    data: AccountSnapshotInput;
};

/**
 * User-facing counterpart to the AI's update_task tool. Same content-merge
 * shape, but answeredBy is USER here — this is the human filling the form
 * directly, not Dazai answering on their behalf. Action determines what
 * happens after the merge: SaveProgress just persists it, MarkComplete
 * requires full completion
 */

export async function updateAccountSnapshotTask(userId: string, body: updateAccountSnapshotTaskBody) {
    if (!["MarkComplete", "SaveProgress"].includes(body.action)) {
        return {
            status: 400,
            success: false,
            message: `Invalid action "${body.action}".`,
        };
    }

    if (!isValidData(body.data)) {
        return {
            status: 400,
            success: false,
            message: "Invalid data. Expected an array of { followersTotal: number, connectionsTotal: number, date: string }.",
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

    const existingContent = task.content as AccountSnapshot
    const mergedContent: AccountSnapshot = { ...existingContent, ...body.data }

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

            const isFullyAnswered = mergedContent.followersTotal !== null && mergedContent.connectionsTotal !== null;
            if (!isFullyAnswered) {
                return {
                    status: 400,
                    success: false,
                    message: "Not every field input is provided yet — can't mark this complete.",
                };
            }

            const updated = await prisma.mainTask.update({
                where: { id: task.id },
                data: {
                    content: mergedContent,
                    status: MainTaskStatus.COMPLETED,
                },
            });

            await reportTaskCompletionToSubAgent(userId, {
                ...updated,
                content: mergedContent,
            } as MainTask);

            return {
                status: 200,
                success: true,
                message: "Marked complete and sent to Maha.",
            };
        }
    }
}