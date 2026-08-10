import { GoogleGenAI, Type } from "@google/genai";
import { MainLog } from "../../../lib/types";
import { Step } from "./getChatHistory";
import { TOOL_SCHEMAS } from "../tools";

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

export async function createStreamWithRetry(systemPrompt: string, chatHistory: Step[], retries = 3, delayMs = 2000) {
    const logs: MainLog[] = [];

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await ai.interactions.create({
                model: process.env.DAZAI_GEMINI_MODEL || "gemini-3.6-flash",
                system_instruction: systemPrompt,
                input: chatHistory,
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