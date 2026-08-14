import { LinkedinContentStatus, LinkedinLogLevel, LinkedinTriggerType } from "../../generated/prisma";
import { getAutomatedLog } from "./helpers/automatedMessages";
import { generateAIResponse } from "./generateAIResponse";
import { UserMessageData } from "../../lib/types";
import { getChatId } from "./getChatId";
import { prisma } from "../../lib/db";

export async function sendChatMessage(userId: string, contents: UserMessageData["contents"]) {
    try {
        const { chatId, principalName, linkedinConnected } = await getChatId(userId)

        await prisma.linkedinChatMessage.create({
            data: {
                triggerType: LinkedinTriggerType.USER,
                chatId,
                contents: {
                    create: contents.map((content, sequence) => ({
                        contentType: content.contentType,
                        message: content.message,
                        output: content.output,
                        status: LinkedinContentStatus.COMPLETED,
                        sequence,
                        logs: {
                            create: {
                                level: LinkedinLogLevel.INFO,
                                message: getAutomatedLog({ event: "LOG.INFO", contentType: content.contentType })
                            }
                        }
                    })),
                },
            }
        });

        await generateAIResponse({ chatId, userId, principalName, linkedinConnected, contents })

        return {
            success: true,
            status: 200,
            message: "Successfully contacted Maha-chan!!"
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to send message.",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}