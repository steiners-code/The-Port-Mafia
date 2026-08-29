import { LinkedinContentStatus } from "../../../generated/prisma";
import { Annotation, LinkedinLog } from "../../../lib/types";
import { executeFunctionCall } from "./executeFunctionCall";
import { getAutomatedMessage } from "./automatedMessages";
import { JsonValue } from "@prisma/client/runtime/client";
import { sendEvent } from "../../../lib/send-event";
import { ToolContext } from "../tools/definitions";
import { prisma } from "../../../lib/db";

type ThoughtContentOutput = {
    type: "thought",
    thoughtSignature?: string,
    thoughtSummary?: string,
    annotations?: Annotation[],
}

type TextContentOutput = {
    type: "model_output",
    text: string | null
}

type ToolContentOutput = {
    type: "function_call",
    funcCallId: string
    funcCallName: string,
    funcArgsAccumulate: string
}

type MessageContentOutput = ThoughtContentOutput | TextContentOutput | ToolContentOutput;
type MessageContentData = {
    id: string,
    status: LinkedinContentStatus,
    message: string | null,
    output: JsonValue | null,
}

interface UpdateMessageProps {
    context: ToolContext
    contentId: string,
    status: LinkedinContentStatus,
    logs: LinkedinLog[],
    output: MessageContentOutput,
    startedAt?: Date
}

export async function updateMessageContent({
    context,
    contentId,
    status,
    logs,
    output,
    startedAt
}: UpdateMessageProps) {
    let data: MessageContentData;

    switch (output.type) {
        case "thought":
            data = await prisma.linkedinMessageContent.update({
                where: { id: contentId },
                data: {
                    message: getAutomatedMessage({ event: "MESSAGE.COMPLETED", contentType: "THOUGHT", startedAt }),
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
            data = await prisma.linkedinMessageContent.update({
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
                    output: true,
                    status: true,
                },
            })
            break;

        case "function_call":
            const { funcCallResult, funcCallIsError, logs: execLogs } = await executeFunctionCall(
                output.funcCallName,
                output.funcArgsAccumulate,
                context
            );

            data = await prisma.linkedinMessageContent.update({
                where: { id: contentId },
                data: {
                    status: funcCallIsError ? LinkedinContentStatus.FAILED : LinkedinContentStatus.COMPLETED,
                    message: getAutomatedMessage({
                        event: "MESSAGE.COMPLETED",
                        contentType: "TOOL",
                        startedAt,
                        toolName: output.funcCallName,
                        isError: funcCallIsError,
                    }),
                    output: {
                        funcCallId: output.funcCallId,
                        funcCallName: output.funcCallName,
                        funcArgsAccumulate: output.funcArgsAccumulate,
                        funcCallResult,
                        funcCallIsError,
                    },
                    logs: {
                        createMany: {
                            data: execLogs,
                        },
                    },
                },
                select: {
                    id: true,
                    message: true,
                    output: true,
                    status: true,
                },
            });
            break;
    }

    await sendEvent({
        event_type: "content.completed",
        content: { ...data }
    })
}