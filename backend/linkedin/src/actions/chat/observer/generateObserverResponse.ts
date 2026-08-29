import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel, LinkedinMessageStatus, LinkedinPostCategory } from "../../../generated/prisma";
import { createStreamWithRetry, GenerateConfig, StreamInitError } from "../helpers/createStreamWithRetry";
import { displayContinueButton } from "../helpers/displayContinueButton";
import { getChatHistoryForRole } from "../helpers/getChatHistoryForRole";
import { createMessageContent } from "../helpers/createMessageContent";
import { updateMessageContent } from "../helpers/updateMessageContent";
import { getObserverSystemPrompt } from "./getObserverSystemPrompt";
import { handleObserverResponse } from "./handleObserverResponse";
import { getAutomatedLog } from "../helpers/automatedMessages";
import { resolveObserverNeeds } from "./resolveObserverNeeds";
import { updateAIChatMessage } from "../helpers/chatMessage";
import { LinkedinLog, StepState } from "../../../lib/types";
import { recordMessageUsage } from "../recordMessageUsage";
import { appendHistoryEntry } from "../../../lib/cache";

/**
 * SOUL_C's two shapes (SOUL_C.md §5) — needs still outstanding, or the
 * gathered facts once it has enough. Same structural pattern as B: both
 * are legitimate stopping points for a single call into this function;
 * which one came back is decided by parsing, not by the caller.
 */
export type ObserverNeedsResponse = {
    needs: string[];
    narration: string;
};

export type ObserverFactsResponse = {
    narration: string;
};

export type ObserverResponse = ObserverNeedsResponse | ObserverFactsResponse;

function isObserverNeedsResponse(parsed: ObserverResponse): parsed is ObserverNeedsResponse {
    return "needs" in parsed;
}

type GenerateObserverResponse = {
    messageId: string;
    userId: string;
    timeZone: string;
    principalName: string;
    schema: object;
    category: LinkedinPostCategory;
    title: string;
    hook_technique: string | null;
    body_technique: string | null;
    cta_technique: string | null;
    /**
     * Only needed on the facts-turn call (after the task-report action
     * has real answers in hand) — undefined on the needs-turn call,
     * where there's nothing to assemble yet. The model's own output no
     * longer carries facts; the harness assembles them from the
     * already-answered Question[] it already has, since re-emitting
     * question+answer the model was already given is wasted output
     * tokens for data the harness already holds both halves of.
     */
    facts?: { question: string; answer: string }[];
};

const generateConfig: GenerateConfig = {
    model: process.env.LINKEDIN_GEMINI_MODEL || "gemini-3.5-flash-lite",
    apiKey: process.env.LINKEDIN_GEMINI_API_KEY!,
    thinking_level: "high",
    thinking_summaries: "auto",
}

export async function generateObserverResponse({ messageId, userId, principalName, timeZone, schema, category, title, hook_technique, body_technique, cta_technique, facts }: GenerateObserverResponse) {
    let reRun: boolean = false;
    let reRunCount: number = 0;
    let activeIndex: number | null = null;

    try {
        await updateAIChatMessage(messageId, LinkedinMessageStatus.PENDING);

        do {
            reRunCount++;
            reRun = false;

            const stepStates: Record<number, StepState> = {}
            const systemPrompt = await getObserverSystemPrompt({ userId, principalName, timeZone })
            const chatHistory = await getChatHistoryForRole("OBSERVER", userId);
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

                        let parsed: ObserverResponse;
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

                        // Same reasoning as B: persist this turn's
                        // contentId into C's own bucket regardless of
                        // which shape it turned out to be — a needs turn
                        // must be resumable too.
                        await appendHistoryEntry(userId, "OBSERVER", messageId, {
                            type: "model",
                            contentId: [state.contentId],
                        });

                        // facts vs needs branches AFTER persistence —
                        // only a facts response hands off downstream to
                        // WRITER; a needs response stops here and waits
                        // on the principal's answer via the task-report
                        // route.
                        if (!parsed) {
                            break;
                        }

                        if (isObserverNeedsResponse(parsed)) {
                            await resolveObserverNeeds(parsed.needs, userId)
                        } else {
                            if (!facts) {
                                throw new Error("Observer produced a facts-shaped final response but no facts were supplied to generateObserverResponse — this call must be the task-report resumption, which is required to pass the real answered Q&A pairs in.");
                            }
                            await handleObserverResponse({ facts }, category, title, hook_technique, body_technique, cta_technique, { messageId, userId })
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
                            await appendHistoryEntry(userId, "OBSERVER", messageId, {
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
                            await appendHistoryEntry(userId, "OBSERVER", messageId, {
                                type: "model",
                                contentId: [errContentId]
                            })
                        }

                        await updateAIChatMessage(messageId, LinkedinMessageStatus.FAILED);
                        await displayContinueButton({ messageId, role: "OBSERVER", reason: errorMessage })
                        break;
                }
            }
        } while (reRun)
    } catch (error) {
        console.error("[generateObserverResponse] fatal error:", error);
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