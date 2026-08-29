import { LinkedinContentType } from "../../../generated/prisma"
import { FunctionResultStep, Step } from "../../../lib/types"
import { JsonValue } from "@prisma/client/runtime/client"

type SystemContent = {
    contentType: LinkedinContentType,
    message: string | null,
    output: JsonValue
}

export async function createSystemContent(content: SystemContent[]): Promise<Step[]> {
    const systemContent: Step[] = []
    let funcCallResults: FunctionResultStep[] = []

    content = content.filter(c => c.contentType !== "MEDIA")

    for (const [index, c] of content.entries()) {
        const nextC = content[index + 1];

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

                let parsedArguments: object = {};
                try {
                    const trimmed = String(c.output.funcArgsAccumulate).trim();
                    if (!trimmed) parsedArguments = {};
                    else parsedArguments = JSON.parse(trimmed);
                } catch {
                    throw new Error("Failed to parse stored tool arguments.");
                }

                systemContent.push({
                    type: "function_call",
                    id: String(c.output.funcCallId),
                    name: String(c.output.funcCallName),
                    arguments: parsedArguments,
                });

                funcCallResults.push({
                    type: "function_result",
                    call_id: String(c.output.funcCallId),
                    name: String(c.output.funcCallName),
                    is_error: Boolean(c.output.funcCallIsError),
                    result: JSON.stringify(c.output.funcCallResult),
                });

                if (nextC?.contentType !== "TOOL") {
                    systemContent.push(...funcCallResults)
                    funcCallResults = [];
                }

                break;
        }
    }

    return systemContent
}