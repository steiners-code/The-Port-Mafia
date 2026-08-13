import { AGENT_REGISTRY } from "./helpers/subAgents";
import { prisma } from "../../lib/db";

export async function getChatId(userId: string) {
    const chat = await prisma.mainChat.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: {
            id: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    connectedApps: {
                        where: {
                            app: { in: AGENT_REGISTRY.map((agent) => agent.platform) }
                        },
                        select: { app: true, status: true }
                    }
                }
            }
        }
    });

    const principalName = [chat.user.firstName, chat.user.lastName]
        .filter(Boolean)
        .join(' ');

    return { chatId: chat.id, principalName, connections: chat.user.connectedApps };
}