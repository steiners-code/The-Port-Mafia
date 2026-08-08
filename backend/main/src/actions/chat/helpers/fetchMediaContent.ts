import { Content, Metadata } from "../../../lib/types"

type MediaContentData = {
    uri: string,
    metadata: Metadata
}
// {
//     fileName: string,
//     fileDescription?: string,
//     fileExtension: string,
//     fileCategory: string,
//     fileContent: string,
// }

export async function fetchMediaContent({ uri, metadata }: MediaContentData): Promise<Content[]> {
    const content: Content[] = []

    // TODO: fetch media content from db or blob storage server based on contentId and category inside the metadata.
    // Resolve the content for specific categories like image, pdf, csv etc. using switch and specifc file content extractor.
    return content;
}