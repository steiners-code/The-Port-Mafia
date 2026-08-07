import { MainContentStatus, MainTriggerType } from "../../generated/prisma";
import { UserMessageData } from "../../lib/types";
import { getChatId } from "./getChatId";
import { prisma } from "../../lib/db";
import { generateAIResponse } from "./generateAIResponse";

export async function sendChatMessage(userId: string, contents: UserMessageData["contents"]) {
    try {
        const { chatId, principalName, connections } = await getChatId(userId)

        // TODO: Metadata Here, contentId and stuff may change in future
        await prisma.mainChatMessage.create({
            data: {
                triggerType: MainTriggerType.USER,
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

        await generateAIResponse({ chatId, userId, principalName, connections, contents })

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