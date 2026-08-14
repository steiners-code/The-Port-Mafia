import { getAutomatedLog, getAutomatedMessage } from "./automatedMessages";
import { LinkedinContentType, LinkedinLogLevel } from "../../../generated/prisma";
import { EventType } from "../../../lib/enums";
import { prisma } from "../../../lib/db";

export async function createMessageContent(messageId: string, type: LinkedinContentType, index: number, toolName?: string) {
    const message = getAutomatedMessage({ event: "MESSAGE.STARTED", contentType: type, toolName })

    const data = await prisma.linkedinMessageContent.create({
        data: {
            contentType: type,
            sequence: index,
            chatMessageId: messageId,
            message,
            logs: {
                create: {
                    level: LinkedinLogLevel.INFO,
                    message: getAutomatedLog({ event: "LOG.INFO", contentType: type })
                }
            }
        },
        select: {
            id: true,
            contentType: true,
            sequence: true,
            message: true,
            status: true,
            createdAt: true,
        },
    });

    // await sendEvent({ event_type: EventType.CONTENTCREATED, message: { ...data } })

    return data.id
}