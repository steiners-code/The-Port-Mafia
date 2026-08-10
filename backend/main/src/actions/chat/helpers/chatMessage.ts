import { MainTriggerType } from "../../../generated/prisma";
import { EventType } from "../../../lib/enums";
import { prisma } from "../../../lib/db";

// TODO: Implement SSE

export async function createAIChatMessage(chatId: string) {
    const data = await prisma.mainChatMessage.create({
        data: {
            chatId,
            triggerType: MainTriggerType.SYSTEM,
        },
        select: {
            id: true,
            triggerType: true,
            createdAt: true,
        }
    })

    // await sendEvent({ event_type: EventType.MESSAGECREATED, message: { ...data } })

    return data.id
}

export async function updateAIChatMessage(messageId: string) {
    // await sendEvent({ event_type: EventType.MESSAGECOMPLETED, message: { id: messageId } })
}