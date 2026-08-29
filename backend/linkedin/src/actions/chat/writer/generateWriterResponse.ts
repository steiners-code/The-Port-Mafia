import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel, LinkedinMessageStatus, LinkedinPostCategory, LinkedinMediaType } from "../../../generated/prisma";
import { createStreamWithRetry, GenerateConfig, StreamInitError } from "../helpers/createStreamWithRetry";
import { getChatHistoryForRole } from "../helpers/getChatHistoryForRole";
import { displayContinueButton } from "../helpers/displayContinueButton";
import { createMessageContent } from "../helpers/createMessageContent";
import { updateMessageContent } from "../helpers/updateMessageContent";
import { getWriterSystemPrompt } from "./getWriterSystemPrompt";
import { validateTemplateUsage } from "./validateTemplateUsage";
import { getAutomatedLog } from "../helpers/automatedMessages";
import { handleWriterResponse } from "./handleWriterResponse";
import { updateAIChatMessage } from "../helpers/chatMessage";
import { LinkedinLog, StepState } from "../../../lib/types";
import { recordMessageUsage } from "../recordMessageUsage";
import { appendHistoryEntry } from "../../../lib/cache";
import { Type } from "@google/genai";

/**
 * SOUL_D is single-turn — no needs/final split like B and C. There is no
 * stage downstream of this one, and no "still needs something from the
 * principal" shape defined in SOUL_D.md at all; every completed turn IS
 * the final output.
 */
type ContentSlot = {
    page: number;
    textHeading: string | null;
    textSubheading: string | null;
    textCredit: string | null;
    textParagraph: string | null;
}

export type WriterResponse = {
    hook: string;
    body: string;
    cta: string;
    comment: string;
    media: {
        type: LinkedinMediaType;
        template_id: string | null;
        direction: string | null
        // content_slots: ContentSlot[];
    };
    scheduled_day: string;
    scheduled_window: string;
    narration: string;
};

type GenerateWriterResponse = {
    messageId: string;
    userId: string;
    timeZone: string;
    principalName: string;
    category: LinkedinPostCategory;
    title: string;
    angle: string | null;
    hook_technique: string | null;
    body_technique: string | null;
    cta_technique: string | null;
    facts: { question: string; answer: string }[];
};

const schema = {
    type: Type.OBJECT,
    properties: {
        hook: {
            type: Type.STRING,
        },
        body: {
            type: Type.STRING,
        },
        cta: {
            type: Type.STRING,
        },
        comment: {
            type: Type.STRING,
        },
        media: {
            type: Type.OBJECT,
            properties: {
                type: {
                    type: Type.STRING,
                    enum: ["IMAGE", "CAROUSEL", "NONE"],
                },
                template_id: {
                    type: Type.STRING,
                    nullable: true,
                },
                direction: {
                    type: Type.STRING,
                    nullable: true,
                }
                // content_slots: {
                //     type: Type.ARRAY,
                //     items: {
                //         type: Type.OBJECT,
                //         properties: {
                //             page: {
                //                 type: Type.NUMBER,
                //             },
                //             textHeading: {
                //                 type: Type.STRING,
                //                 nullable: true
                //             },
                //             textSubheading: {
                //                 type: Type.STRING,
                //                 nullable: true
                //             },
                //             textCredit: {
                //                 type: Type.STRING,
                //                 nullable: true
                //             },
                //             textParagraph: {
                //                 type: Type.STRING,
                //                 nullable: true
                //             }
                //         },
                //         required: ["page", "textHeading", "textSubheading", "textCredit", "textParagraph"]
                //     },
                //     empty: true,
                // },
            },
            required: ["type", "template_id", "direction"],
        },
        scheduled_day: {
            type: Type.STRING,
        },
        scheduled_window: {
            type: Type.STRING,
        },
        narration: {
            type: Type.STRING,
        },
    },
    required: [
        "hook",
        "body",
        "cta",
        "comment",
        "media",
        "scheduled_day",
        "scheduled_window",
        "narration",
    ],
}

const generateConfig: GenerateConfig = {
    model: process.env.LINKEDIN_GEMINI_MODEL || "gemini-3.5-flash-lite",
    apiKey: process.env.LINKEDIN_GEMINI_API_KEY!,
    thinking_level: "high",
    thinking_summaries: "auto",
}

export async function generateWriterResponse({ messageId, userId, principalName, timeZone, category, title, hook_technique, body_technique, cta_technique, facts, angle }: GenerateWriterResponse) {
    let reRun: boolean = false;
    let reRunCount: number = 0;
    let activeIndex: number | null = null;

    try {
        await updateAIChatMessage(messageId, LinkedinMessageStatus.PENDING);

        do {
            reRunCount++;
            reRun = false;

            const stepStates: Record<number, StepState> = {}
            const systemPrompt = await getWriterSystemPrompt({ userId, principalName, timeZone })
            const chatHistory = await getChatHistoryForRole("WRITER", userId);
            const stream = await createStreamWithRetry({ systemPrompt, chatHistory, schema, ...generateConfig })

            for await (const event of stream) {
                console.log(`[stream event] type=${event.event_type} index=${(event as any).index ?? "-"}`);

                switch (event.event_type) {
                    case "interaction.created":
                        break;

                    case "step.start":
                        const index = event.index;
                        activeIndex = index;
                        let contentId = "";
                        console.log(`[step.start] index=${index} step.type=${event.step.type}`);

                        switch (event.step.type) {
                            case "thought":
                                contentId = await createMessageContent(messageId, LinkedinContentType.THOUGHT, event.index);
                                stepStates[index] = {
                                    type: "thought",
                                    contentId,
                                    thoughtSummary: "",
                                    annotations: [],
                                    text: "",
                                    startedAt: new Date(),
                                    logs: [],
                                    funcCallId: "",
                                    funcCallName: "",
                                    funcArgsAccumulate: "",
                                };
                                break;

                            case "model_output":
                                contentId = await createMessageContent(messageId, LinkedinContentType.TEXT, event.index);
                                stepStates[index] = {
                                    type: "model_output",
                                    contentId,
                                    thoughtSummary: "",
                                    annotations: [],
                                    text: "",
                                    startedAt: new Date(),
                                    logs: [],
                                    funcCallId: "",
                                    funcCallName: "",
                                    funcArgsAccumulate: "",
                                };
                                break;

                            case "function_call":
                                contentId = await createMessageContent(messageId, LinkedinContentType.TOOL, event.index);
                                stepStates[index] = {
                                    type: "function_call",
                                    contentId,
                                    funcCallId: event.step.id,
                                    funcCallName: event.step.name,
                                    funcArgsAccumulate: "",
                                    thoughtSummary: "",
                                    annotations: [],
                                    text: "",
                                    startedAt: new Date(),
                                    logs: [],
                                };
                                break;
                        };
                        break;

                    case "step.delta":
                        console.log(`[step.delta] index=${event.index} step.delta.type=${event.delta.type}`);

                        const activeStep = stepStates[event.index]
                        if (!activeStep) break;

                        switch (event.delta.type) {
                            case "thought_signature":
                                if (event.delta.signature) activeStep.thoughtSignature = event.delta.signature
                                break;

                            case "thought_summary":
                                if (event.delta.content?.type !== "text") break;

                                const text = event.delta.content?.text || ""
                                activeStep.thoughtSummary += text;

                                const annotations = event.delta.content?.annotations;
                                if (annotations) activeStep?.annotations.push(...annotations);
                                break;

                            case "text":
                                const output = event.delta.text || ""
                                activeStep.text += output
                                break;

                            case "arguments_delta":
                                activeStep.funcArgsAccumulate += event.delta.arguments
                                break;
                        }
                        break;

                    case "step.stop":
                        const state = stepStates[event.index]
                        console.log(`[step.stop] index=${event.index} state.type=${state.type} state=${state}`);
                        if (!state) break;

                        const contentType = state.type === "thought" ? "THOUGHT" : state.type === "model_output" ? "TEXT" : state.type === "function_call" ? "TOOL" : "MEDIA"
                        state.logs.push({
                            level: LinkedinLogLevel.SUCCESS,
                            message: getAutomatedLog({ event: "LOG.SUCCESS", contentType }),
                            createdAt: new Date()
                        })

                        let parsed: WriterResponse;
                        try {
                            parsed = JSON.parse(state.text.trim() ? state.text.replace(/^```(?:json)?\s*|\s*```$/g, "") : "null");
                        } catch (error) {
                            console.error("[ERROR]: ", error)
                            throw new Error(`Unable to parse JsonOutput: ${error instanceof Error ? error.message : "Unkown Error!"}`)
                        }

                        await updateMessageContent({
                            context: { userId, messageId, principalName, timeZone },
                            contentId: state.contentId,
                            status: LinkedinContentStatus.COMPLETED,
                            logs: state.logs,
                            output: {
                                type: state.type,
                                thoughtSignature: state.thoughtSignature,
                                thoughtSummary: state.thoughtSummary,
                                annotations: state.annotations,
                                text: parsed?.narration,
                                funcCallId: state.funcCallId,
                                funcCallName: state.funcCallName,
                                funcArgsAccumulate: state.funcArgsAccumulate,
                            },
                            startedAt: state.startedAt
                        })

                        await appendHistoryEntry(userId, "WRITER", messageId, {
                            type: "model",
                            contentId: [state.contentId],
                        });

                        // No needs/final branch — a null parse here means
                        // this step was a thought/tool step with no JSON
                        // text of its own (see the trim() guard above),
                        // not a genuine empty final output. Only hand off
                        // once real parsed content with the required
                        // fields actually came back.
                        if (parsed && "hook" in parsed) {
                            try {
                                validateTemplateUsage(parsed.media);
                            } catch (error) {
                                const errMessage = (error as Error).message
                                appendHistoryEntry(userId, "WRITER", messageId, {
                                    type: "user_input",
                                    text: errMessage
                                })
                                reRun = true;
                                break;
                            }

                            await handleWriterResponse(parsed, category, title, angle, {
                                cta_technique,
                                body_technique,
                                hook_technique
                            }, { messageId, userId })
                        }
                        break;

                    case "interaction.completed":
                        const usage = event.interaction.usage;
                        await recordMessageUsage({
                            userId,
                            messageId,
                            inputTokens: usage?.total_input_tokens ?? 0,
                            outputTokens: usage?.total_output_tokens ?? 0,
                            toolUseTokens: usage?.total_tool_use_tokens ?? 0,
                            reasoningTokens: usage?.total_thought_tokens ?? 0,
                            cachedTokens: usage?.total_cached_tokens ?? 0,
                            totalTokens: usage?.total_tokens ?? 0,
                            provider: "GOOGLE",
                            ...generateConfig,
                        });

                        if (event.interaction.status === "requires_action") {
                            reRun = true;
                            break;
                        };

                        console.log(`[interactions.completed] messageId=${messageId}`);
                        await updateAIChatMessage(messageId, LinkedinMessageStatus.SUCCESS);
                        break;

                    case "error":
                        const errorState = activeIndex !== null ? stepStates[activeIndex] : null
                        const errorMessage = event.error?.message || "An unexpected stream error occurred.";
                        console.log(`[error] errorState=${errorState} activeIndex=${activeIndex} errorMessage=${errorMessage}`)

                        if (errorState) {
                            errorState.logs.push({ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() })
                            await updateMessageContent({
                                context: { userId, messageId, principalName, timeZone },
                                contentId: errorState.contentId,
                                status: LinkedinContentStatus.FAILED,
                                logs: errorState.logs,
                                output: {
                                    type: errorState.type,
                                    thoughtSignature: errorState.thoughtSignature,
                                    thoughtSummary: errorState.thoughtSummary,
                                    annotations: errorState.annotations,
                                    text: errorState.text,
                                    funcCallId: errorState.funcCallId,
                                    funcCallName: errorState.funcCallName,
                                    funcArgsAccumulate: errorState.funcArgsAccumulate,
                                },
                                startedAt: errorState.startedAt
                            })

                            await appendHistoryEntry(userId, "WRITER", messageId, {
                                type: "model",
                                contentId: [errorState.contentId]
                            })
                        } else if (messageId) {
                            const errContentId = await createMessageContent(messageId, LinkedinContentType.TEXT, 0);
                            await updateMessageContent({
                                context: { userId, messageId, principalName, timeZone },
                                contentId: errContentId,
                                status: LinkedinContentStatus.FAILED,
                                logs: [{ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() }],
                                output: {
                                    type: "model_output",
                                    text: `[Error]: ${errorMessage}`
                                }
                            });

                            await appendHistoryEntry(userId, "WRITER", messageId, {
                                type: "model",
                                contentId: [errContentId]
                            })
                        }

                        await updateAIChatMessage(messageId, LinkedinMessageStatus.FAILED);
                        await displayContinueButton({ messageId, role: "WRITER", reason: errorMessage })
                        break;
                }
            }
        } while (reRun)
    } catch (error) {
        console.error("[generateWriterResponse] fatal error:", error);
        const errContentId = await createMessageContent(messageId, LinkedinContentType.TEXT, 0, false);

        const errorMessage = error instanceof Error ? error.message : "Internal Server Error!";
        const logs: LinkedinLog[] = error instanceof StreamInitError
            ? error.logs
            : [{ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() }];

        await updateMessageContent({
            context: { userId, messageId, principalName, timeZone },
            contentId: errContentId,
            status: LinkedinContentStatus.FAILED,
            logs,
            output: {
                type: "model_output",
                text: `[System Failure]: ${errorMessage}`
            }
        });

        await updateAIChatMessage(messageId, LinkedinMessageStatus.FAILED);
    }
}