import { Content, Output } from "../../../lib/types";
import { getTaskById } from "../../tasks/getTaskById";

export async function fetchMediaContent(data: Output, userId: string): Promise<Content[]> {
    const content: Content[] = []

    switch (data.category) {
        case "TEXT":
            if (data.extension === "CSV") {
                break;
            } else if (data.data)
                content.push({
                    type: "text",
                    text: [
                        `${data.name}.${data.extension.toLowerCase()}`,
                        "---",
                        "## Content",
                        data.data
                    ].join("\n")
                })
            break;

        case "IMAGE":
            const res = await urlToBase64(data.uri)
            if (!res) break;
            content.push({
                type: "image",
                data: res.data,
                mime_type: res.mimeType,
            })
            break;

        case "TASK":
            const task = await getTaskById(userId, data.id)
            if (!task.success || !task.data) break;
            content.push({
                type: "text",
                text: [
                    `# Task - ${task.data.title}`,
                    `**Status:** ${task.data.status} - **Level:** ${task.data.level} - **Type:** ${task.data.type}`,
                    `Task ID: ${task.data.id}`,
                    '---',
                    `Requested by ${task.data.subAgent}, the ${task.data.subAgentPlatform} for ${task.data.subAgentPlatform}`,
                    '---',
                    '# Content',
                    JSON.stringify(task.data.content, null, 2),
                ].join('\n')
            })

    }

    return content;
}

/**
 * Fetches a remote file (e.g. an ImageKit URL) and returns it as base64
 * with its mime type, in the shape Gemini's inline_data expects.
 */
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch file for base64 conversion: ${res.status}`);
        }

        const mimeType = res.headers.get("content-type") ?? "application/octet-stream";
        const arrayBuffer = await res.arrayBuffer();
        const data = Buffer.from(arrayBuffer).toString("base64");

        return { data, mimeType };
    } catch (error) {
        console.log(error)
        return null
    }
}