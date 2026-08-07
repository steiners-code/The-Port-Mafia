import { createAIChatMessage, createMessageContent, createStreamWithRetry, StreamInitError, updateAIChatMessage, updateMessageContent } from "./helpers/chat";
import { Annotation, MainLog, UserMessageData } from "../../lib/types";
import { fetchMediaContent } from "./helpers/fetchMediaContent";
import { getSystemPrompt } from "./helpers/getSystemPrompt";
import { MainContentType } from "../../generated/prisma";
import { Connections } from "./helpers/subAgents";

type GenerateAIResponseData = {
    chatId: string,
    userId: string,
    principalName: string,
    connections: Connections,
    contents: UserMessageData["contents"],
}

type StepState = {
    type: "thought" | "model_output";
    contentId: string;
    logs: MainLog[];

    thoughtSignature?: string;
    thoughtSummary: string;
    annotations: Annotation[];
    text: string;
};

type JsonOuput = {
    message: string | null
}

export async function generateAIResponse({ chatId, userId, principalName, connections, contents }: GenerateAIResponseData) {
    let messageId: string = "";
    let activeIndex: number | null = null;

    const stepStates: Record<number, StepState> = {}

    try {
        const systemPrompt = await getSystemPrompt(userId, principalName, connections)

        let userText: string[] = [];
        let userMedia: string[] = [];
        for (const content of contents) {
            switch (content.contentType) {
                case MainContentType.TEXT:
                    userText.push(content?.message || "(empty)")
                    break;

                case MainContentType.MEDIA:
                    if (!content?.output) {
                        userMedia.push("Couldn't fetch media content. Missing uri and metadata");
                        break;
                    }

                    const {
                        fileContent,
                        fileName,
                        fileDescription,
                        fileExtension,
                        fileCategory
                    } = await fetchMediaContent(content.output);

                    userMedia.push([
                        `### ${fileName} – ${fileExtension}`,
                        `> ${fileDescription || "(No Description)"}`,
                        `#### Category: ${fileCategory}`,
                        `### Content`,
                        fileContent,
                    ].join("\n"));

                    break;
            }
        }

        const userPrompt = [
            "## User Query",
            userText.join("\n"),
            "---",
            "## Attached Media",
            userMedia.join("\n---\n"),
        ].join('\n');

        const stream = await createStreamWithRetry(systemPrompt, userPrompt);

        for await (const event of stream) {
            console.log(`[stream event] type=${event.event_type} index=${(event as any).index ?? "-"}`);

            switch (event.event_type) {
                case "interaction.created":
                    messageId = await createAIChatMessage(chatId);
                    break;

                case "step.start":
                    const index = event.index;
                    activeIndex = index;
                    let contentId = "";
                    console.log(`[step.start] index=${index} step.type=${event.step.type}`);

                    switch (event.step.type) {
                        case "thought":
                            contentId = await createMessageContent(messageId, MainContentType.THOUGHT, event.index);
                            stepStates[index] = {
                                type: "thought",
                                contentId,
                                thoughtSummary: "",
                                annotations: [],
                                text: "",
                                logs: []
                            };
                            break;

                        case "model_output":
                            contentId = await createMessageContent(messageId, MainContentType.TEXT, event.index);
                            stepStates[index] = {
                                type: "model_output",
                                contentId,
                                thoughtSummary: "",
                                annotations: [],
                                text: "",
                                logs: []
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
                    }
                    break;

                case "step.stop":
                    const state = stepStates[event.index]
                    console.log(`[step.stop] index=${event.index} state.type=${state.type} state=${state}`);
                    if (!state) break;

                    state.logs.push({ level: "SUCCESS", message: `${state.type} process completed after consuming MILLIONS in tokens.` }) // TODO: Implement Automated LOG.SUCCESS Message

                    switch (state.type) {
                        case "thought":
                            await updateMessageContent(state.contentId, "COMPLETED", state.logs, {
                                type: "thought",
                                thoughtSignature: state.thoughtSignature,
                                thoughtSummary: state.thoughtSummary,
                                annotations: state.annotations,
                            })
                            break;
                        case "model_output":
                            let cleanMessage: string | null = null;
                            try {
                                const parsed: JsonOuput = JSON.parse(state.text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
                                cleanMessage = parsed.message ?? null;
                            } catch (error) {
                                cleanMessage = state.text;
                            }

                            await updateMessageContent(state.contentId, "COMPLETED", state.logs, {
                                type: "model_output",
                                text: cleanMessage,
                            })
                            break;
                    }
                    break;

                case "interaction.completed":
                    console.log(`[interactions.completed] messageId=${messageId}`);
                    await updateAIChatMessage(messageId);
                    break;

                case "error":
                    const errorState = activeIndex !== null ? stepStates[activeIndex] : null
                    const errorMessage = event.error?.message || "An unexpected stream error occurred.";
                    console.log(`[error] errorState=${errorState} activeIndex=${activeIndex} errorMessage=${errorMessage}`)

                    if (errorState) {
                        errorState.logs.push({ level: "ERROR", message: errorMessage })
                        await updateMessageContent(errorState.contentId, "FAILED", errorState.logs, {
                            type: errorState.type,
                            thoughtSignature: errorState.thoughtSignature,
                            thoughtSummary: errorState.thoughtSummary,
                            annotations: errorState.annotations,
                            text: errorState.text
                        })
                    } else if (messageId) {
                        const errContentId = await createMessageContent(messageId, MainContentType.TEXT, 0);
                        await updateMessageContent(errContentId, "FAILED", [
                            { level: "ERROR", message: errorMessage }
                        ], {
                            type: "model_output",
                            text: `[Error]: ${errorMessage}`
                        });
                    }
                    break;
            }
        }
    } catch (error) {
        console.error("[generateAIResponse] fatal error:", error);

        const errorMessage = error instanceof Error ? error.message : "Internal Server Error!";
        const logs: MainLog[] = error instanceof StreamInitError
            ? error.logs
            : [{ level: "ERROR", message: errorMessage }];

        if (!messageId) messageId = await createAIChatMessage(chatId);

        const errContentId = await createMessageContent(messageId, MainContentType.TEXT, 0);
        await updateMessageContent(errContentId, "FAILED", logs, {
            type: "model_output",
            text: `[System Failure]: ${errorMessage}`
        });
    }
}