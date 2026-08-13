import { Content, Output } from "../../../lib/types";

export async function fetchMediaContent(data: Output): Promise<Content[]> {
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

    }

    // TODO: fetch media content from db or blob storage server based on contentId and category inside the metadata.
    // Resolve the content for specific categories like image, pdf, csv etc. using switch and specifc file content extractor.
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