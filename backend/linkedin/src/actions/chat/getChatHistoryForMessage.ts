import { createSystemContent } from "./helpers/createSystemContent";
import { LinkedinTriggerType } from "../../generated/prisma";
import { Step } from "../../lib/types";
import { prisma } from "../../lib/db";

export async function getChatHistoryForMessage(messageId: string) {
    const historyContent: Step[] = []

    historyContent.push({
        type: "user_input",
        content: [{
            type: "text",
            text: "Weekly LinkedIn analysis time. Review the last 7 days of performance, decide this week's next post category and angle following the 3-2-1-1 shape, and pick a technique per role from the bank if one genuinely fits."
        }]
    })

    try {
        const message = await prisma.linkedinChatMessage.findUnique({
            where: {
                id: messageId,
                triggerType: LinkedinTriggerType.SYSTEM,
            },
            select: {
                id: true,
                createdAt: true,
                triggerType: true,
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
        });

        if (!message || !message.contents) {
            return historyContent;
        }

        const systemData = await createSystemContent(message.contents)
        historyContent.push(...systemData)

        return historyContent;
    } catch (error) {
        console.error(error);
        return historyContent;
    }
}