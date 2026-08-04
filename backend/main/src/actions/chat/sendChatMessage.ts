import { MainTriggerType } from "../../generated/prisma";
import { UserMessageData } from "../../lib/types";
import { getChatId } from "./getChatId";
import { prisma } from "../../lib/db";

export async function sendChatMessage(userId: string, contents: UserMessageData["contents"]) {
    try {
        const chatId = await getChatId(userId)

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
                        sequence,
                    })),
                },
            }
        });

        // TODO: Initiate chat with AI.

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