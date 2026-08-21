import { triggerAnalystResponse } from "../chat/analyst/triggerAnalystResponse";
import { clearHistory, clearSeed } from "../../lib/cache";
import { prisma } from "../../lib/db";

export async function triggerCron() {
    const users = await prisma.linkedinProfile.findMany({
        where: { token: { refresh_token: { not: undefined } } },
        select: { userId: true }
    })

    for (const user of users) {
        await Promise.all([
            clearHistory(user.userId, "ANALYST"),
            clearSeed(user.userId, "ANALYST"),
            clearHistory(user.userId, "STRATEGIST"),
            clearSeed(user.userId, "STRATEGIST"),
            clearHistory(user.userId, "OBSERVER"),
            clearSeed(user.userId, "OBSERVER"),
            clearHistory(user.userId, "WRITER"),
        ]);
        await triggerAnalystResponse(user.userId);
    }

    return;
}