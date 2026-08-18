import { LinkedinContentStatus, LinkedinLogLevel, LinkedinMainAgent, LinkedinMessageStatus, LinkedinTriggerType } from "../../generated/prisma";
import { getAutomatedLog } from "./helpers/automatedMessages";
import { createAIChatMessage } from "./helpers/chatMessage";
import { UserMessageData } from "../../lib/types";
import { sendEvent } from "../../lib/send-event";
import { getChatId } from "./getChatId";
import { prisma } from "../../lib/db";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("chat-maha-balor", { connection });

export async function sendChatMessage(userId: string, contents: UserMessageData["contents"], triggerType: LinkedinTriggerType = LinkedinTriggerType.USER, agent?: LinkedinMainAgent) {
    try {
        const { chatId, principalName, linkedinConnected } = await getChatId(userId)

        const data = await prisma.linkedinChatMessage.create({
            data: {
                triggerType,
                agent,
                chatId,
                status: LinkedinMessageStatus.SUCCESS,
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
            },
            include: { contents: true }
        });

        await sendEvent({
            event_type: "message.full",
            message: {
                id: data.id,
                status: LinkedinMessageStatus.SUCCESS,
                createdAt: data.createdAt,
                triggerType: data.triggerType,
                agent: data.agent,
                contents: data.contents.map((c) => ({
                    id: c.id,
                    contentType: c.contentType,
                    sequence: c.sequence,
                    message: c.message,
                    output: c.output,
                    status: c.status,
                    createdAt: c.createdAt,
                }))
            }
        });

        const messageId = await createAIChatMessage(chatId)

        await chatQueue.add("generate", {
            messageId,
            chatId,
            userId,
            principalName,
            linkedinConnected,
            contents,
        }, {
            jobId: messageId,
        });

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