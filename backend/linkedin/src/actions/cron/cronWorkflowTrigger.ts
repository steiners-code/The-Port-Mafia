import { triggerPostPerformanceRequest } from "./triggerPostPerformanceRequest";
import { triggerAnalystResponse } from "../chat/analyst/triggerAnalystResponse";
import { isHitting4AMWindow, resolveTimezone } from "./timezone";
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

    const users = await prisma.linkedinProfile.findMany({
        where: { token: { refresh_token: { not: undefined } } },
        select: { userId: true, locale_country: true }
    })

    for (const user of users) {
        try {
            index++;
            const timezone = resolveTimezone(user.locale_country);
            // TODO: for testing
            // if (!isHitting4AMWindow(timezone)) {
            //     skippedCount++;
            //     continue;
            // }


            await Promise.all([
                clearHistory(user.userId, "ANALYST"),
                clearSeed(user.userId, "ANALYST"),
                clearHistory(user.userId, "STRATEGIST"),
                clearSeed(user.userId, "STRATEGIST"),
                clearHistory(user.userId, "OBSERVER"),
                clearSeed(user.userId, "OBSERVER"),
                clearHistory(user.userId, "WRITER"),
            ]);

            await resolveWeekStart(user.userId, timezone)
            await triggerPostPerformanceRequest(user.userId)
            await triggerAnalystResponse(user.userId);

            logs.push({
                index,
                status: 200,
                level: LOGLEVEL.SUCCESS,
                message: `Resolved Week, Triggered Post Request and AI Workflow for userId='${user.userId}' at ${user.locale_country}`,
                timestamp: new Date()
            })
        } catch (error) {
            failedCount++;

            logs.push({
                index,
                status: 500,
                level: LOGLEVEL.ERROR,
                message: `Failed cron triggers for userId='${user.userId}' at ${user.locale_country}. REASON: ${error instanceof Error ? error.message : "Internal Server Error!"}`,
                timestamp: new Date()
            })
        }
    }

    return {
        success: true,
        status: 200,
        message: `Successfully triggered Week Resolution, Post Performance Request and AI Workflows for ${users.length - failedCount - skippedCount} users`,
        data: {
            triggers_failed: failedCount,
            skipped_triggers: skippedCount,
            total_triggers: users.length,
            logs,
        },
    }
}