import { MainContentType } from "../../../generated/prisma"
import { JsonValue } from "@prisma/client/runtime/client"
import { Content } from "../../../lib/types"

type SystemContent = {
    contentType: MainContentType,
    message: string | null,
    output: JsonValue
}

type ReturnContent = ModelOutputStep | ThoughtStep | FunctionCallStep | FunctionResultStep

export type ModelOutputStep = {
    type: "model_output",
    content: Content[]
}

export type ThoughtStep = {
    type: "thought",
    signature: string,
    summary?: Content[],
}

export type FunctionCallStep = {
    type: "function_call",
    id: string,
    name: string,
    arguments: {
        [k: string]: any;
    }
}

export type FunctionResultStep = {
    type: "function_result",
    call_id: string,
    is_error?: boolean,
    name?: string,
    result: string,
}

export async function createSystemContent(content: SystemContent[]): Promise<ReturnContent[]> {
    const systemContent: ReturnContent[] = []

    for (const c of content) {
        switch (c.contentType) {
            case "TEXT":
                systemContent.push({
                    type: "model_output",
                    content: [{
                        type: "text",
                        text: JSON.stringify({ message: c.message })
                    }]
                });
                break;

            case "THOUGHT":
                if (c.output === null || typeof c.output !== "object" || Array.isArray(c.output))
                    break;

                systemContent.push({
                    type: "thought",
                    signature: String(c.output.thoughtSignature),
                    summary: c.output.thoughtSummary ? [{
                        type: "text",
                        text: String(c.output.thoughtSummary)
                    }] : undefined,
                });
                break;

            case "TOOL":
                if (c.output === null || typeof c.output !== "object" || Array.isArray(c.output))
                    break;

                let parsedArguments: Record<string, any> = {};
                try {
                    parsedArguments = JSON.parse(String(c.output.funcArgsAccumulate));
                } catch {
                    parsedArguments = { "[Error]": "Failed to parse stored tool arguments." };
                }

                systemContent.push({
                    type: "function_call",
                    id: String(c.output.funcCallId),
                    name: String(c.output.funcCallName),
                    arguments: parsedArguments,
                });

                systemContent.push({
                    type: "function_result",
                    call_id: String(c.output.funcCallId),
                    name: String(c.output.funcCallName),
                    is_error: Boolean(c.output.funcCallIsError),
                    result: JSON.stringify(c.output.funcCallResult),
                });
        }
    }

    return systemContent
}