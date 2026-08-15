import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel } from "../../../generated/prisma";
import { getAutomatedLog, getAutomatedMessage } from "./automatedMessages";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

export async function createMessageContent(messageId: string, type: LinkedinContentType, index: number, initialLog: boolean = true, toolName?: string) {
    const message = getAutomatedMessage({ event: "MESSAGE.STARTED", contentType: type, toolName })

    const data = await prisma.linkedinMessageContent.create({
        data: {
            contentType: type,
            sequence: index,
            chatMessageId: messageId,
            message,
            ...(initialLog && {
                logs: {
                    create: {
                        level: LinkedinLogLevel.INFO,
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
            status: true,
            createdAt: true,
        },
    });

    await sendEvent({
        event_type: "content.created",
        content: { ...data, messageId, status: LinkedinContentStatus.PENDING }
    })

    return data.id
}