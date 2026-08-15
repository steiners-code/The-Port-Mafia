import { MainContentStatus, MainMessageStatus, MainTriggerType } from "../../generated/prisma";
import { createAIChatMessage } from "./helpers/chatMessage";
import { UserMessageData } from "../../lib/types";
import { getChatId } from "./getChatId";
import { prisma } from "../../lib/db";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("chat-osamu-dazai", { connection });

export async function sendChatMessage(userId: string, contents: UserMessageData["contents"]) {
    try {
        const { chatId, principalName, connections } = await getChatId(userId)

        await prisma.mainChatMessage.create({
            data: {
                triggerType: MainTriggerType.USER,
                status: MainMessageStatus.SUCCESS,
                chatId,
                contents: {
                    create: contents.map((content, sequence) => ({
                        contentType: content.contentType,
                        message: content.message,
                        output: content.output,
                        status: MainContentStatus.COMPLETED,
                        sequence,
                    })),
                },
            }
        });

        const messageId = await createAIChatMessage(chatId)

        await chatQueue.add(
            "generate",
            {
                messageId,
                chatId,
                userId,
                principalName,
                connections,
                contents,
            },
            {
                jobId: messageId,
            }
        );

        return {
            success: true,
            status: 200,
            message: "Successfully contacted Dazia-kun!!"
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