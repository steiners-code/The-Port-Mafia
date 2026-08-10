import { Artifact, Content, Document, File, Journal, Output } from "../../../lib/types";

export async function fetchMediaContent(data: Output): Promise<Content[]> {
    const content: Content[] = []

    switch (data.metadata.category) {
        case "FILE":
        case "JOURNAL":
        case "ARTIFACT":
        case "TEXT":
        case "PDF":
    }

    // TODO: fetch media content from db or blob storage server based on contentId and category inside the metadata.
    // Resolve the content for specific categories like image, pdf, csv etc. using switch and specifc file content extractor.
    return content;
}

export function isFile(data: Output): data is File {
    return data.metadata.category === "FILE";
}

export function isJournal(data: Output): data is Journal {
    return data.metadata.category === "JOURNAL";
}

export function isArtifact(data: Output): data is Artifact {
    return data.metadata.category === "ARTIFACT";
}

export function isBlobDocument(data: Output): data is Document {
    return data.metadata.category === "PDF" || data.metadata.category === "TEXT";
}