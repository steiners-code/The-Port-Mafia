import { LinkedinTriggerType, LinkedinMessageStatus } from "../../../generated/prisma";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

export async function createAIChatMessage(chatId: string) {
    const data = await prisma.linkedinChatMessage.create({
        data: {
            chatId,
            triggerType: LinkedinTriggerType.SYSTEM,
        },
        select: {
            id: true,
            triggerType: true,
            createdAt: true,
        }
    })

    await sendEvent({
        event_type: "message.created",
        message: { ...data, status: LinkedinMessageStatus.QUEUED }
    })

    return data.id
}

export async function updateAIChatMessage(messageId: string, status: LinkedinMessageStatus) {
    const data = await prisma.linkedinChatMessage.update({
        where: { id: messageId },
        data: { status },
        select: { id: true, status: true }
    });

    switch (data.status) {
        case "PENDING":
            await sendEvent({
                event_type: "message.delta",
                message: { id: data.id, status: data.status }
            });
            break;

        case "SUCCESS":
        case "FAILED":
            await sendEvent({
                event_type: "message.completed",
                message: { id: data.id, status: data.status }
            })
            break;
    }
}