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

/**
 * Groups tasks the way a real todo dashboard would, not a flat dump:
 * counts per status, a standalone critical count (the thing you'd want
 * surfaced first in any real todo app), and a platform -> agent -> role
 * breakdown. Built generically off whatever's actually in `tasks` rather
 * than hardcoded to today's single sub-agent, so it stays correct as
 * more platforms/agents/roles get added.
 */
function summarize(tasks: { status: MainTaskStatus; level: string; subAgentPlatform: string; subAgent: string; subAgentRole: string }[]) {
    const byStatus: Record<string, number> = {};
    for (const status of ACTIVE_TASK_STATUSES) byStatus[status] = 0;

    let criticalCount = 0;
    const byPlatform: Record<string, { total: number; byAgent: Record<string, { total: number; byRole: Record<string, number> }> }> = {};

    for (const task of tasks) {
        byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
        if (task.level === "CRITICAL") criticalCount++;

        byPlatform[task.subAgentPlatform] ??= { total: 0, byAgent: {} };
        byPlatform[task.subAgentPlatform].total++;

        byPlatform[task.subAgentPlatform].byAgent[task.subAgent] ??= { total: 0, byRole: {} };
        byPlatform[task.subAgentPlatform].byAgent[task.subAgent].total++;

        const byRole = byPlatform[task.subAgentPlatform].byAgent[task.subAgent].byRole;
        byRole[task.subAgentRole] = (byRole[task.subAgentRole] ?? 0) + 1;
    }

    return {
        total: tasks.length,
        criticalCount,
        byStatus,
        byPlatform,
    };
}

export async function getTasks(args: { status?: string }, { userId }: ToolContext) {
    if (args.status && !isActiveStatus(args.status))
        throw new Error(`The provided status "${args.status}" is invalid. Valid values are: ${ACTIVE_TASK_STATUSES.join(" | ")}.`);

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
            subAgent: true,
            subAgentPlatform: true,
            subAgentRole: true,
            createdAt: true,
        },
        orderBy: [{ level: "asc" }, { createdAt: "asc" }],
    });

    if (tasks.length === 0) {
        return {
            message: args.status
                ? `No tasks currently have status ${args.status}.`
                : "No active tasks right now.",
            summary: summarize(tasks),
            tasks: [],
        };
    }

    return {
        message: args.status
            ? `Found ${tasks.length} task(s) with status ${args.status}.`
            : `Found ${tasks.length} active task(s) across ${Object.keys(summarize(tasks).byPlatform).length} platform(s).`,
        summary: summarize(tasks),
        tasks,
    };
};

export async function getWholeTaskById(args: { id: string }, { userId }: ToolContext) {
    const task = await prisma.mainTask.findUnique({
        where: { id: args.id, userId },
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
            comments: {
                select: {
                    content: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!task) {
        throw new Error("Task not found.");
    }

    return {
        message: `Full content for task "${task.title}" (${task.type}).`,
        task,
    };
}