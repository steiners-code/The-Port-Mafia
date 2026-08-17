import { MainMessageStatus, SubAgent } from "../../../generated/prisma";
import { createSystemContent } from "./createSystemContent";
import { Step, UserMessageData } from "../../../lib/types";
import { createUserContent } from "./createUserContent";
import { prisma } from "../../../lib/db";
import { startOfDay } from "date-fns";

export async function getChatHistory(userId: string, contents: UserMessageData["contents"]): Promise<Step[]> {
    const userContent = await createUserContent(contents, userId);
    const historyContent: Step[] = []
    const dayStart = startOfDay(new Date());

    try {
        const history = await prisma.mainChat.findUnique({
            where: { userId },
            select: {
                messages: {
                    where: {
                        status: { in: [MainMessageStatus.SUCCESS, MainMessageStatus.PENDING] },
                        createdAt: {
                            gte: dayStart,
                        },
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        triggerType: true,
                        agent: true,
                        contents: {
                            select: {
                                contentType: true,
                                message: true,
                                output: true,
                            },
                            orderBy: [
                                { createdAt: 'asc' },
                                { sequence: 'asc' }
                            ]
                        },
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!history || !history.messages) {
            return [userContent];
        }

        for (const message of history.messages) {
            if (message.contents.length === 0) break;

            switch (message.triggerType) {
                case "USER":
                    const userData = await createUserContent(message.contents, userId)
                    historyContent.push(userData);
                    break;

                case "SYSTEM":
                    if (isCorrectSubAgent(message.agent)) {
                        const systemData = await createUserContent(message.contents, userId)
                        historyContent.push(systemData)
                    } else {
                        const systemData = await createSystemContent(message.contents)
                        historyContent.push(...systemData)
                    }
                    break;

                case "CRON":
                    break;
            }
        }

        return historyContent;
    } catch (error) {
        console.error(error);
        return [userContent];
    }
}

export function isCorrectSubAgent(agent: SubAgent | null | undefined): agent is SubAgent {
    if (!agent) return false;
    return Object.values(SubAgent).includes(agent);
}