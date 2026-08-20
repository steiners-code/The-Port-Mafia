import { triggerAnalystResponse } from "../chat/analyst/triggerAnalystResponse";
import { prisma } from "../../lib/db";

export async function triggerCron() {
    const users = await prisma.linkedinProfile.findMany({
        where: { token: { refresh_token: { not: undefined } } },
        select: { userId: true }
    })

    for (const user of users) {
        await triggerAnalystResponse(user.userId);
    }

    return;
}