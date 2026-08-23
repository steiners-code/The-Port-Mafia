import { triggerPostPerformanceRequest } from "./triggerPostPerformanceRequest";
import { triggerAnalystResponse } from "../chat/analyst/triggerAnalystResponse";
import { clearHistory, clearSeed } from "../../lib/cache";
import { resolveWeekStart } from "./resolveWeekStart";
import { LOGLEVEL } from "../../lib/enums";
import { Logs } from "../../lib/types";
import { prisma } from "../../lib/db";

export async function cronWorkflowTrigger() {
    let index = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let logs: Logs[] = [];

    type TargetedUser = { userId: string; timezone: string };

    const usersToExecute = await prisma.$queryRaw<TargetedUser[]>`
        SELECT p."userId", p."timezone" 
        FROM "linkedin"."LinkedinProfile" p
        INNER JOIN "linkedin"."LinkedinToken" t ON t."userId" = p."userId"
        WHERE EXTRACT(HOUR FROM (NOW() AT TIME ZONE p."timezone")) = 4
    `;

    if (usersToExecute.length === 0) {
        return {
            success: true,
            status: 200,
            message: `No users require Week Resolution, Post Performance Request and AI Workflow Trigger.`,
            data: {
                triggers_failed: failedCount,
                skipped_triggers: skippedCount,
                total_triggers: usersToExecute.length,
                logs,
            },
        }
    }

    for (const user of usersToExecute) {
        try {
            index++;
            await Promise.all([
                clearHistory(user.userId, "ANALYST"),
                clearSeed(user.userId, "ANALYST"),
                clearHistory(user.userId, "STRATEGIST"),
                clearSeed(user.userId, "STRATEGIST"),
                clearHistory(user.userId, "OBSERVER"),
                clearSeed(user.userId, "OBSERVER"),
                clearHistory(user.userId, "WRITER"),
            ]);

            await resolveWeekStart(user.userId, user.timezone)
            await triggerPostPerformanceRequest(user.userId)
            await triggerAnalystResponse(user.userId);

            logs.push({
                index,
                status: 200,
                level: LOGLEVEL.SUCCESS,
                message: `Resolved Week, Triggered Post Request and AI Workflow for userId='${user.userId}' at ${user.timezone}`,
                timestamp: new Date()
            })
        } catch (error) {
            failedCount++;

            logs.push({
                index,
                status: 500,
                level: LOGLEVEL.ERROR,
                message: `Failed cron triggers for userId='${user.userId}' at ${user.timezone}. REASON: ${error instanceof Error ? error.message : "Internal Server Error!"}`,
                timestamp: new Date()
            })
        }
    }

    return {
        success: true,
        status: 200,
        message: `Successfully triggered Week Resolution, Post Performance Request and AI Workflows for ${usersToExecute.length - failedCount - skippedCount} users`,
        data: {
            triggers_failed: failedCount,
            skipped_triggers: skippedCount,
            total_triggers: usersToExecute.length,
            logs,
        },
    }
}