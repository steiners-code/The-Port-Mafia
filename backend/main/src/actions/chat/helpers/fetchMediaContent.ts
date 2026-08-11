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
    }

    // TODO: fetch media content from db or blob storage server based on contentId and category inside the metadata.
    // Resolve the content for specific categories like image, pdf, csv etc. using switch and specifc file content extractor.
    return content;
}