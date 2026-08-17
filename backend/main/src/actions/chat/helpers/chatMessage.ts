import { MainMessageStatus, MainTriggerType } from "../../../generated/prisma";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

export async function createAIChatMessage(chatId: string) {
    const data = await prisma.mainChatMessage.create({
        data: {
            chatId,
            triggerType: MainTriggerType.SYSTEM,
            status: MainMessageStatus.QUEUED
        },
        select: {
            id: true,
            agent: true,
            triggerType: true,
            createdAt: true,
        }
    })

    await sendEvent({
        event_type: "message.created",
        message: { ...data, status: MainMessageStatus.QUEUED }
    })

    return data.id
}

export async function updateAIChatMessage(messageId: string, status: MainMessageStatus) {
    const data = await prisma.mainChatMessage.update({
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