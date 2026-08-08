import { MainContentStatus, MainContentType, MainLogLevel, MainTriggerType } from "../../../generated/prisma";
import { getAutomatedLog, getAutomatedMessage } from "./automatedMessages";
import { JsonValue } from "@prisma/client/runtime/client";
import { Annotation, MainLog } from "../../../lib/types";
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

export async function createMessageContent(messageId: string, type: MainContentType, index: number) {
    const message = getAutomatedMessage({ event: "MESSAGE.STARTED", contentType: type })

    const data = await prisma.mainMessageContent.create({
        data: {
            contentType: type,
            sequence: index,
            chatMessageId: messageId,
            message,
            logs: {
                create: {
                    level: MainLogLevel.INFO,
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
        },
    });

    // await sendEvent({ event_type: EventType.CONTENTCREATED, message: { ...data } })

    return data.id
}

export type ThoughtContentOutput = {
    type: "thought",
    thoughtSignature?: string,
    thoughtSummary?: string,
    annotations?: Annotation[],
}

export type TextContentOutput = {
    type: "model_output",
    text: string | null,
}

type MessageContentOutput = ThoughtContentOutput | TextContentOutput;
type MessageContentData = {
    id: string,
    status: MainContentStatus,
    message?: string | null,
    output?: JsonValue | null,
}

export async function updateMessageContent(contentId: string, status: MainContentStatus, logs: MainLog[], output: MessageContentOutput, startedAt?: Date) {
    let message: string;
    let data: MessageContentData;

    switch (output.type) {
        case "thought":
            message = getAutomatedMessage({ event: "MESSAGE.COMPLETED", contentType: "THOUGHT", startedAt })

            data = await prisma.mainMessageContent.update({
                where: { id: contentId },
                data: {
                    message,
                    status: status,
                    output: {
                        thoughtSignature: output.thoughtSignature,
                        thoughtSummary: output.thoughtSummary,
                        annotations: output.annotations,
                    },
                    logs: {
                        createMany: {
                            data: logs,
                        },
                    },
                },
                select: {
                    id: true,
                    message: true,
                    output: true,
                    status: true,
                },
            })
            break;

        case "model_output":
            data = await prisma.mainMessageContent.update({
                where: { id: contentId },
                data: {
                    status: status,
                    message: output.text,
                    logs: {
                        createMany: {
                            data: logs,
                        },
                    },
                },
                select: {
                    id: true,
                    message: true,
                    status: true,
                },
            })
            break;
    }

    // await sendEvent({ event_type: EventType.CONTENTCOMPLETED, message: { ...data } })
}