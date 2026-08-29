import { LinkedinContentStatus, LinkedinMessageStatus } from "../../../generated/prisma";
import { createSystemContent } from "./createSystemContent";
import { Step, UserMessageData } from "../../../lib/types";
import { createUserContent } from "./createUserContent";
import { prisma } from "../../../lib/db";
import { startOfDay } from "date-fns";

export async function getChatHistory(userId: string, contents: UserMessageData["contents"]): Promise<Step[]> {
    const userContent = await createUserContent(contents);
    const historyContent: Step[] = []
    const dayStart = startOfDay(new Date());

    try {
        const history = await prisma.linkedinChat.findUnique({
            where: { userId },
            select: {
                messages: {
                    where: {
                        status: { notIn: [LinkedinMessageStatus.QUEUED] },
                        createdAt: {
                            gte: dayStart,
                        },
                    },
                    select: {
                        id: true,
                        createdAt: true,
                        triggerType: true,
                        contents: {
                            where: { status: { in: [LinkedinContentStatus.COMPLETED] } },
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
            if (message.contents.length === 0) continue;

            switch (message.triggerType) {
                case "USER":
                    const userData = await createUserContent(message.contents)
                    historyContent.push(userData);
                    break;

                case "SYSTEM":
                    const systemData = await createSystemContent(message.contents)
                    historyContent.push(...systemData)
                    break;

                case "CRON":
                    const cronData = await createUserContent(message.contents)
                    historyContent.push(cronData)
                    break;
            }
        }

        console.log(JSON.stringify(historyContent, null, 4))

        return historyContent;
    } catch (error) {
        console.error(error);

        return [userContent, {
            type: "user_input", content: [{
                type: "text",
                text: (error as Error).message ?? "Harness couldn't create chat history. Something went wrong!"
            }]
        }];
    }
}