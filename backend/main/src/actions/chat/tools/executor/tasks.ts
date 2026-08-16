import { MainTaskStatus } from "../../../../generated/prisma";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";

const ACTIVE_TASK_STATUSES = [
    MainTaskStatus.PENDING,
    MainTaskStatus.INPROGRESS,
    MainTaskStatus.INREVIEW,
] as const;

function isActiveStatus(value: string): value is (typeof ACTIVE_TASK_STATUSES)[number] {
    return (ACTIVE_TASK_STATUSES as readonly string[]).includes(value);
}

export async function getTasks(args: { status?: string }, { userId }: ToolContext) {
    if (args.status && !isActiveStatus(args.status)) {
        return {
            success: false,
            message: `The provided status "${args.status}" is invalid. Valid values are: ${ACTIVE_TASK_STATUSES.join(" | ")}.`,
        };
    }

    const tasks = await prisma.mainTask.findMany({
        where: {
            userId,
            status: args.status ? (args.status as MainTaskStatus) : { in: [...ACTIVE_TASK_STATUSES] },
        },
        select: {
            id: true,
            type: true,
            title: true,
            level: true,
            status: true,
            content: true,
            subAgent: true,
            subAgentPlatform: true,
            subAgentRole: true,
            createdAt: true,
        },
    });

    return {
        success: true,
        tasks,
    };
};