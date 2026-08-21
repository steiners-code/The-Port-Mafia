import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel, LinkedinMessageStatus, LinkedinPostCategory, LinkedinTechniqueRole } from "../../../generated/prisma";
import { createStreamWithRetry, StreamInitError } from "../helpers/createStreamWithRetry";
import { displayContinueButton } from "../helpers/displayContinueButton";
import { getChatHistoryForMessage } from "../getChatHistoryForMessage";
import { createMessageContent } from "../helpers/createMessageContent";
import { updateMessageContent } from "../helpers/updateMessageContent";
import { getAnalystSystemPrompt } from "./getAnalystSystemPrompt";
import { handleAnalystResponse } from "./handleAnalystResponse";
import { getAutomatedLog } from "../helpers/automatedMessages";
import { updateAIChatMessage } from "../helpers/chatMessage";
import { LinkedinLog, StepState } from "../../../lib/types";
import { appendHistoryEntry } from "../../../lib/cache";
import { getToolSchemasForRole } from "../tools";
import { Type } from "@google/genai";

const MAX_REITERATIONS = 20;

const AnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        category: {
            type: Type.STRING,
            enum: ["EDUCATIONAL", "PERSONAL", "BUILD_IN_PUBLIC", "ADAPTIVE"],
        },
        angle: {
            type: Type.STRING,
        },
        hook_technique_slug: {
            type: Type.STRING,
            nullable: true,
        },
        body_technique_slug: {
            type: Type.STRING,
            nullable: true,
        },
        cta_technique_slug: {
            type: Type.STRING,
            nullable: true,
        },
        new_techniques: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    slug: {
                        type: Type.STRING,
                    },
                    role: {
                        type: Type.STRING,
                        enum: ["HOOK", "BODY", "CTA"],
                    },
                    category: {
                        type: Type.STRING,
                        enum: ["EDUCATIONAL", "PERSONAL", "BUILD_IN_PUBLIC", "ADAPTIVE"],
                    },
                    description: {
                        type: Type.STRING,
                    },
                    content: {
                        type: Type.STRING,
                    },
                },
                required: ["slug", "role", "category", "description", "content"],
            },
        },
        narration: {
            type: Type.STRING,
        },
    },
    required: [
        "category",
        "angle",
        "hook_technique_slug",
        "body_technique_slug",
        "cta_technique_slug",
        "new_techniques",
        "narration",
    ],
}

export type AnalystResponse = {
    category: LinkedinPostCategory
    angle: string
    hook_technique_slug: string | null
    body_technique_slug: string | null
    cta_technique_slug: string | null
    new_techniques: {
        slug: string,
        role: LinkedinTechniqueRole
        category: LinkedinPostCategory
        description: string,
        content: string,
    }[]
    narration: string
}

function isAnalystResponse(parsed: AnalystResponse): parsed is AnalystResponse {
    return "new_techniques" in parsed;
}

type GenerateAnalystResponse = {
    messageId: string,
    userId: string,
    principalName: string,
}

const ANALYST_TOOLS = getToolSchemasForRole("ANALYST")

export async function generateAnalystResponse({ messageId, userId, principalName }: GenerateAnalystResponse) {
    let reRun: boolean = false;
    let reRunCount: number = 0;
    let activeIndex: number | null = null;

    try {
        await updateAIChatMessage(messageId, LinkedinMessageStatus.PENDING);

        do {
            reRunCount++;
            reRun = false;

            const stepStates: Record<number, StepState> = {}
            const systemPrompt = await getAnalystSystemPrompt({ userId, principalName, maxCalls: MAX_REITERATIONS, remainingCalls: MAX_REITERATIONS - reRunCount })
            const chatHistory = await getChatHistoryForMessage(messageId);
            const TOOL_SCHEMAS = MAX_REITERATIONS > reRunCount ? ANALYST_TOOLS : undefined
            const stream = await createStreamWithRetry(systemPrompt, chatHistory, AnalysisSchema, TOOL_SCHEMAS)

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

                        let parsed: AnalystResponse;
                        try {
                            parsed = JSON.parse(state.text.trim() ? state.text.replace(/^```(?:json)?\s*|\s*```$/g, "") : "null");
                        } catch (error) {
                            console.error("[ERROR]: ", error)
                            throw new Error(`Unable to parse JsonOutput: ${error instanceof Error ? error.message : "Unkown Error!"}`)
                        }

                        await updateMessageContent({
                            context: { userId, messageId, principalName },
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

                        if (parsed !== null && isAnalystResponse(parsed)) {
                            await handleAnalystResponse(parsed, { messageId, userId })
                        }
                        break;

                    case "interaction.completed":
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
                                context: { userId, messageId, principalName },
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

                            await appendHistoryEntry(userId, "ANALYST", messageId, {
                                type: "model",
                                contentId: [errorState.contentId]
                            })
                        } else if (messageId) {
                            const errContentId = await createMessageContent(messageId, LinkedinContentType.TEXT, 0);
                            await updateMessageContent({
                                context: { userId, messageId, principalName },
                                contentId: errContentId,
                                status: LinkedinContentStatus.FAILED,
                                logs: [{ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() }],
                                output: {
                                    type: "model_output",
                                    text: `[Error]: ${errorMessage}`
                                }
                            });

                            await appendHistoryEntry(userId, "ANALYST", messageId, {
                                type: "model",
                                contentId: [errContentId]
                            })
                        }

                        await updateAIChatMessage(messageId, LinkedinMessageStatus.FAILED);
                        await displayContinueButton({ messageId, role: "ANALYST", reason: errorMessage })
                        break;
                }
            }
        } while (reRun)
    } catch (error) {
        console.error("[generateAIResponse] fatal error:", error);
        const errContentId = await createMessageContent(messageId, LinkedinContentType.TEXT, 0, false);

        const errorMessage = error instanceof Error ? error.message : "Internal Server Error!";
        const logs: LinkedinLog[] = error instanceof StreamInitError
            ? error.logs
            : [{ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() }];

        await updateMessageContent({
            context: { userId, messageId, principalName },
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