import { MainContentStatus, MainContentType, MainLogLevel } from "../../../generated/prisma";
import { getAutomatedLog, getAutomatedMessage } from "./automatedMessages";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

export async function createMessageContent(messageId: string, type: MainContentType, index: number, initialLog: boolean = true, toolName?: string) {
    const message = getAutomatedMessage({ event: "MESSAGE.STARTED", contentType: type, toolName })

    const data = await prisma.mainMessageContent.create({
        data: {
            contentType: type,
            sequence: index,
            chatMessageId: messageId,
            status: MainContentStatus.PENDING,
            message,
            ...(initialLog && {
                logs: {
                    create: {
                        level: MainLogLevel.INFO,
                        message: getAutomatedLog({ event: "LOG.INFO", contentType: type })
                    }
                }
            })
        },
        select: {
            id: true,
            contentType: true,
            sequence: true,
            message: true,
            output: true,
            createdAt: true,
        },
    });

    await sendEvent({
        event_type: "content.created",
        content: { ...data, messageId, status: MainContentStatus.PENDING }
    })

    return data.id
}