import { LinkedinContentType } from "../../../generated/prisma"
import { JsonValue } from "@prisma/client/runtime/client"
import { Step } from "../../../lib/types"

type SystemContent = {
    contentType: LinkedinContentType,
    message: string | null,
    output: JsonValue
}

export async function createSystemContent(content: SystemContent[]): Promise<Step[]> {
    const systemContent: Step[] = []

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