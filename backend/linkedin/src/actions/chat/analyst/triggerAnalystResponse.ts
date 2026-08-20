import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel, LinkedinMessageStatus, LinkedinTriggerType } from "../../../generated/prisma";
import { generateAnalystResponse } from "./generateAnalystResponse";
import { getAutomatedLog } from "../helpers/automatedMessages";
import { createAIChatMessage } from "../helpers/chatMessage";
import { sendEvent } from "../../../lib/send-event";
import { getChatId } from "../getChatId";
import { prisma } from "../../../lib/db";
// import { Queue } from "bullmq";
// import Redis from "ioredis";

// TODO: To be added in worker.ts

// const connection = new Redis(process.env.REDIS_URL!, {
//     maxRetriesPerRequest: null,
// });

// const chatQueue = new Queue("analyst-maha-balor", { connection });

export async function triggerAnalystResponse(userId: string) {
    try {
        const { chatId, principalName } = await getChatId(userId);

        const data = await prisma.linkedinChatMessage.create({
            data: {
                triggerType: LinkedinTriggerType.CRON,
                chatId,
                status: LinkedinMessageStatus.SUCCESS,
                contents: {
                    create: {
                        contentType: LinkedinContentType.TEXT,
                        message: "Hey, wake up! It's time for LinkedIn Posting.",
                        status: LinkedinContentStatus.COMPLETED,
                        sequence: 0,
                        logs: {
                            create: {
                                level: LinkedinLogLevel.INFO,
                                message: getAutomatedLog({ event: "LOG.INFO", contentType: LinkedinContentType.TEXT })
                            }
                        }
                    },
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

        await generateAnalystResponse({ messageId, userId, principalName })

        // await chatQueue.add("linkedin-post", {
        //     messageId,
        //     userId,
        //     principalName,
        // }, {
        //     jobId: messageId,
        // });

        return {
            success: true,
            status: 200,
            message: "Successfully initiated analysis for Maha SOUL-A, Analyst"
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to trigger SOUL-A for Maha, Analyst",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}