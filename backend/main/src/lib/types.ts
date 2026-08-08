import { MainContentType, MainLogLevel } from "../generated/prisma"
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

export type UserMessageData = {
    contents: {
        contentType: MainContentType,
        message?: string,
        output?: {
            uri: string,
            metadata: Metadata
        }
    }[]
}

export type Metadata = {
    fileName: string,
    fileDescription?: string,
    fileExtension: string,
    fileCategory: string, // Decide a custom category for those files store in db i.e. USER, MEMORY, JOURNAL, EXPERIENCE
}

export type Annotation = {
    end_index?: number,
    start_index?: number,
    type: "file_citation" | "place_citation" | "url_citation" | "word_info"
}

type TextContent = {
    type: "text",
    text: string,
}

type ImageContent = {
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