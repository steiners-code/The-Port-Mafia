import { LinkedinLog, Step } from "../../../lib/types";
import { awaitRateLimit } from "./rateLimiter";
import { GoogleGenAI } from "@google/genai";

type InteractionTools = NonNullable<
    Parameters<GoogleGenAI["interactions"]["create"]>[0]
>["tools"];

// const openai = new OpenAI({
//     baseURL: 'https://api.deepseek.com',
//     apiKey: process.env.DEEPSEEK_API_KEY!,
// });

export class StreamInitError extends Error {
    logs: LinkedinLog[];
    constructor(message: string, logs: LinkedinLog[]) {
        super(message);
        this.name = "StreamInitError";
        this.logs = logs;
    }
}

export type GenerateConfig = {
    model: string,
    thinking_level: "low" | "high" | "medium" | "minimal",
    thinking_summaries: "auto" | "none",
    apiKey: string,
}

type CreateGenAIStreamArgs = GenerateConfig & {
    systemPrompt: string,
    chatHistory: Step[],
    schema: object,
    TOOL_SCHEMAS?: InteractionTools,
    retries?: number,
    delayMs?: number,
};

export async function createStreamWithRetry({
    systemPrompt,
    chatHistory,
    model,
    thinking_level,
    thinking_summaries,
    apiKey,
    schema,
    TOOL_SCHEMAS,
    delayMs = 1000,
    retries = 3,
}: CreateGenAIStreamArgs) {
    const ai = new GoogleGenAI({ apiKey });

    const logs: LinkedinLog[] = [];

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await awaitRateLimit()

            return await ai.interactions.create({
                model,
                system_instruction: systemPrompt,
                input: chatHistory,
                generation_config: {
                    thinking_level,
                    thinking_summaries,
                },
                response_format: {
                    mime_type: "application/json",
                    type: "text",
                    schema,
                },
                // safety_settings: safetySettings,
                tools: TOOL_SCHEMAS,
                stream: true,
            });
        } catch (error: any) {
            const isTransient = error?.status === 429 || error?.status >= 500;
            if (attempt === retries || !isTransient) throw error;

            logs.push({ level: "ERROR", message: `[GenAI] Transient error (${error.status || error.message}). Retrying attempt ${attempt}/${retries} in ${delayMs}ms...`, createdAt: new Date() })
            await new Promise((res) => setTimeout(res, delayMs * attempt));
        }
    }

    throw new StreamInitError("Failed to initialize stream after maximum retries.", logs);
}

const safetySettings = [
    {
        type: "civic_integrity",
        threshold: "block_none",
    },
    {
        type: "dangerous_content",
        threshold: "block_none",
    },
    {
        type: "harassment",
        threshold: "block_none",
    },
    {
        type: "hate_speech",
        threshold: "block_none",
    },
    {
        type: "image_dangerous_content",
        threshold: "block_none",
    },
    {
        type: "image_harassment",
        threshold: "block_none",
    },
    {
        type: "image_hate",
        threshold: "block_none",
    },
    {
        type: "image_sexually_explicit",
        threshold: "block_none",
    },
    {
        type: "jailbreak",
        threshold: "block_none",
    },
    {
        type: "sexually_explicit",
        threshold: "block_none",
    },
];