import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel } from "../../generated/prisma";
import { createStreamWithRetry, StreamInitError } from "./helpers/createStreamWithRetry";
import { createAIChatMessage, updateAIChatMessage } from "./helpers/chatMessage";
import { Annotation, LinkedinLog, UserMessageData } from "../../lib/types";
import { updateMessageContent } from "./helpers/updateMessageContent";
import { createMessageContent } from "./helpers/createMessageContent";
import { getAutomatedLog } from "./helpers/automatedMessages";
import { getSystemPrompt } from "./helpers/getSystemPrompt";
import { getChatHistory } from "./helpers/getChatHistory";

type GenerateAIResponseData = {
    chatId: string,
    userId: string,
    principalName: string,
    linkedinConnected: boolean,
    contents: UserMessageData["contents"],
}

type StepState = {
    type: "thought" | "model_output" | "function_call";
    contentId: string;
    logs: LinkedinLog[];

    thoughtSignature?: string;
    thoughtSummary: string;
    annotations: Annotation[];
    startedAt: Date;

    text: string;

    funcCallId: string,
    funcCallName: string,
    funcArgsAccumulate: string,
};

export async function generateAIResponse({ chatId, userId, principalName, linkedinConnected, contents }: GenerateAIResponseData) {
    let reRun: boolean = false;
    let messageId: string = "";
    let activeIndex: number | null = null;

    try {
        do {
            const stepStates: Record<number, StepState> = {}

            reRun = false;
            const systemPrompt = await getSystemPrompt(userId, principalName, linkedinConnected)
            const chatHistory = await getChatHistory(userId, contents);
            if (!chatHistory) throw new Error("Unable to retrieve chat history!")

            const stream = await createStreamWithRetry(systemPrompt, chatHistory);

            for await (const event of stream) {
                console.log(`[stream event] type=${event.event_type} index=${(event as any).index ?? "-"}`);

                switch (event.event_type) {
                    case "interaction.created":
                        if (!messageId)
                            messageId = await createAIChatMessage(chatId);
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
                                text: state.text,
                                funcCallId: state.funcCallId,
                                funcCallName: state.funcCallName,
                                funcArgsAccumulate: state.funcArgsAccumulate,
                            },
                            startedAt: state.startedAt
                        })
                        break;

                    case "interaction.completed":
                        if (event.interaction.status === "requires_action") {
                            reRun = true;
                            break;
                        };

                        console.log(`[interactions.completed] messageId=${messageId}`);
                        await updateAIChatMessage(messageId);
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
                                status: LinkedinContentStatus.COMPLETED,
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
                        }
                        break;
                }
            }
        } while (reRun);
    } catch (error) {
        console.error("[generateAIResponse] fatal error:", error);

        const errorMessage = error instanceof Error ? error.message : "Internal Server Error!";
        const logs: LinkedinLog[] = error instanceof StreamInitError
            ? error.logs
            : [{ level: LinkedinLogLevel.ERROR, message: errorMessage, createdAt: new Date() }];

        if (!messageId) messageId = await createAIChatMessage(chatId);

        const errContentId = await createMessageContent(messageId, LinkedinContentType.TEXT, 0);
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
    }
}