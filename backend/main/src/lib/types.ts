import { AppType, MainContentType, MainFileType, MainLogLevel, MainTaskLevel, MainTaskStatus, SubAgent } from "../generated/prisma"
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

export type File = BaseMetadata & {
    fileType: MainFileType,
    extension: "MD",
    category: "FILE"
}

export type Journal = BaseMetadata & {
    extension: "JOURNAL",
    category: "JOURNAL"
}

export type Artifact = BaseMetadata & {
    extension: "TXT" | "MD",
    category: "ARTIFACT"
}

export type Task = BaseMetadata & {
    id: string,
    extension: "TASK",
    category: "TASK"
}

type PDFDocument = BaseMetadata & {
    uri?: string,
    data?: string,
    extension: "PDF",
    category: "PDF"
}

type ImageDocument = BaseMetadata & {
    uri: string,
    category: "IMAGE",
    extension: "PNG" | "JPEG" | "WEBP" | "HEIC" | "HEIF" | "GIF" | "BMP" | "TIFF" | (string & {})
}

type TextDocument = BaseMetadata & {
    uri?: string,
    data?: string,
    extension: "TXT" | "CSV" | "MD",
    category: "TEXT"
}

export type Document = TextDocument | ImageDocument
export type Output = File | Task | Document

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

export type Content = TextContent | DocumentContent | ImageContent;
export type StepMap = "thought" | "model_output";


type ModelOutputStep = {
    type: "model_output",
    content: Content[]
}

type ThoughtStep = {
    type: "thought",
    signature: string,
    summary?: (TextContent | ImageContent)[],
}

type FunctionCallStep = {
    type: "function_call",
    id: string,
    name: string,
    arguments: {
        [k: string]: any;
    }
}

type FunctionResultStep = {
    type: "function_result",
    call_id: string,
    is_error?: boolean,
    name?: string,
    result: string,
}

type UserInputStep = {
    type: "user_input",
    content?: Content[]
}

export type Step = UserInputStep | ModelOutputStep | ThoughtStep | FunctionCallStep | FunctionResultStep

export type MainTask = {
    id: string
    title: string
    level: MainTaskLevel
    status: MainTaskStatus
} & QuestionnaireTask

export type QuestionnaireTask = SubAgents & {
    type: "QUESTIONNAIRE",
    content: Question[]
}

export type Question = {
    index: number,
    question: string,
    answer: string | null
    answeredBy: "USER" | "DAZAI" | null
}

export type CreateTaskBody = { title: string } & QuestionnaireTaskBody

export type QuestionnaireTaskBody = SubAgents & {
    type: "QUESTIONNAIRE",
    questions: string[],
}

export type SubAgents = MahaLinkedIn

type MahaLinkedIn = {
    subAgent: typeof SubAgent.MAHA
    subAgentPlatform: typeof AppType.LINKEDIN
    subAgentRole: "OBSERVER" | "ANALYST" | "STRATEGIST" | "WRITER" | "HANDLER"
}