import { MainContentType, MainFileType, MainLogLevel } from "../generated/prisma"
import { LOGLEVEL } from "./enums"

export type Logs = {
    index: number
    timestamp: Date
    level: LOGLEVEL
    status: number
    message: string
    details?: string
}

export type MainLog = {
    level: MainLogLevel,
    message: string,
    createdAt: Date,
}

type BaseMetadata = {
    name: string;
    description?: string;
};

type FileMetadata = BaseMetadata & {
    extension: "MD",
    category: "FILE"
}

type JournalMetadata = BaseMetadata & {
    extension: "JOURNAL",
    category: "JOURNAL"
}

type ArtifactMetadata = BaseMetadata & {
    extension: "TXT" | "MD",
    category: "ARTIFACT"
}

type PDFDocumentMetadata = BaseMetadata & {
    extension: "PDF",
    category: "PDF"
}
type TextDocumentMetadata = BaseMetadata & {
    extension: "TXT" | "CSV",
    category: "TEXT"
}

type DocumentMetadata = TextDocumentMetadata | PDFDocumentMetadata

export type File = {
    userId: string,
    fileType: MainFileType,
    metadata: FileMetadata
}

export type Journal = {
    userId: string,
    metadata: JournalMetadata
}

export type Artifact = {
    userId: string,
    metadata: ArtifactMetadata
}

export type Document = {
    uri?: string,
    data?: string,
    metadata: DocumentMetadata
}

export type Output = File | Journal | Artifact | Document

export type UserMessageData = {
    contents: {
        contentType: MainContentType,
        message?: string,
        output?: Output,
    }[]
}

export type Annotation = {
    end_index?: number,
    start_index?: number,
    type: "file_citation" | "place_citation" | "url_citation" | "word_info"
}

export type TextContent = {
    type: "text",
    text: string,
}

export type ImageContent = {
    type: "image",
    data?: string,
    uri?: string,
    mime_type?: "image/png" | "image/jpeg" | "image/webp" | "image/heic" | "image/heif" | "image/gif" | "image/bmp" | "image/tiff" | (string & {}),
    resolution?: "low" | "medium" | "high" | "ultra_high" | (string & {}),
}

type AudioContent = {
    type: "audio",
    data?: string,
    uri?: string,
    channel?: number,
    sample_rate?: number
    mime_type?: string,
}

type DocumentContent = {
    type: "document",
    data?: string,
    uri?: string,
    mime_type?: "application/pdf" | "text/csv" | (string & {}),
}

type VideoContent = {
    type: "video",
    data?: string,
    uri?: string,
    mime_type?: string,
    resolution?: string
}

export type Content = TextContent;

export type StepMap = "thought" | "model_output";