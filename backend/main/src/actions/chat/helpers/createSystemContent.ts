import { MainContentType } from "../../../generated/prisma"
import { JsonValue } from "@prisma/client/runtime/client"
import { Content } from "../../../lib/types"

type SystemContent = {
    contentType: MainContentType,
    message: string | null,
    output: JsonValue
}

type ReturnContent = ModelOutputStep | ThoughtStep

export type ModelOutputStep = {
    type: "model_output",
    content: Content[]
}

export type ThoughtStep = {
    type: "thought",
    signature: string,
    summary: Content[],
}

export async function createSystemContent(content: SystemContent[]): Promise<ReturnContent[]> {
    const modelContent: Content[] = [];
    const systemContent: ReturnContent[] = []

    for (const c of content) {
        switch (c.contentType) {
            case "TEXT":
                modelContent.push({
                    type: "text",
                    text: JSON.stringify({ message: c.message })
                });
                break;

            case "THOUGHT":
                if (c.output === null || typeof c.output !== "object" || Array.isArray(c.output))
                    break;

                console.log(JSON.stringify(c.output, null, 4))
                systemContent.push({
                    type: "thought",
                    signature: String(c.output.thoughtSignature),
                    summary: [{
                        type: "text",
                        text: String(c.output.thoughtSummary)
                    }]
                });
                break;
        }
    }

    systemContent.push({
        type: "model_output",
        content: modelContent,
    })

    return systemContent
}