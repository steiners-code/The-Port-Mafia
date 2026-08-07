import { MainContentStatus, MainContentType, MainLogLevel, MainTriggerType } from "../../../generated/prisma";
import { JsonValue } from "@prisma/client/runtime/client";
import { Annotation, MainLog } from "../../../lib/types";
import { GoogleGenAI, Type } from "@google/genai";
import { EventType } from "../../../lib/enums";
import { prisma } from "../../../lib/db";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

// const openai = new OpenAI({
//     baseURL: 'https://api.deepseek.com',
//     apiKey: process.env.DEEPSEEK_API_KEY!,
// });

export class StreamInitError extends Error {
    logs: MainLog[];
    constructor(message: string, logs: MainLog[]) {
        super(message);
        this.name = "StreamInitError";
        this.logs = logs;
    }
}

export async function createStreamWithRetry(systemPrompt: string, userPrompt: string, retries = 3, delayMs = 2000) {
    const logs: MainLog[] = [];

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await ai.interactions.create({
                model: "gemini-3.5-flash-lite",
                system_instruction: systemPrompt,
                input: userPrompt,
                generation_config: {
                    thinking_level: "high",
                    thinking_summaries: "auto",
                },
                response_format: {
                    mime_type: "application/json",
                    type: "text",
                    schema: {
                        type: Type.OBJECT,
                        properties: {
                            message: {
                                type: Type.STRING,
                                nullable: true,
                            },
                        },
                        required: ["message"],
                    }
                },
                stream: true,
            });
        } catch (error: any) {
            const isTransient = error?.status === 429 || error?.status >= 500;
            if (attempt === retries || !isTransient) throw error;

            logs.push({ level: "ERROR", message: `[GenAI] Transient error (${error.status || error.message}). Retrying attempt ${attempt}/${retries} in ${delayMs}ms...` })
            await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
    }

    throw new StreamInitError("Failed to initialize stream after maximum retries.", logs);
}

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
    const data = await prisma.mainMessageContent.create({
        data: {
            contentType: type,
            sequence: index,
            chatMessageId: messageId,
            message: "Thinking...", // TODO: Implement Automated THOUGHT.STARTED Message.
            logs: {
                create: {
                    level: MainLogLevel.INFO,
                    message: `Started ${type} process.` // TODO: Implement Automated LOG.INFO Message.
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

export async function updateMessageContent(contentId: string, status: MainContentStatus, logs: MainLog[], output: MessageContentOutput) {
    let data: MessageContentData;

    switch (output.type) {
        case "thought":
            data = await prisma.mainMessageContent.update({
                where: { id: contentId },
                data: {
                    message: "Thought for BILLION years.", // TODO: Implement Automated THOUGHT.COMPLETE Message
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