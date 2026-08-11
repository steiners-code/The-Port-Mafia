import { Annotation, JsonValue } from "../types"
import { Agent } from "@/data/agents"

export type FileMediaExtensions = "USER" | "MEMORY" | "EXPERIENCE" | "JOURNAL"

type BaseMetadata = {
    name: string,
    description?: string,
}

// ---------- THOUGHT ---------- 
export type Thought = {
    type: "THOUGHT",
    thoughtSummary: string,
    annotations?: Annotation[],
    agent: Agent | null,
}

export type ThoughtMetadata = BaseMetadata & { extension: "THOUGHT" }

// ---------- LOGS ---------- 

export type Logs = {
    type: "LOGS"
    messageId: string,
}

export type LogsMetadata = BaseMetadata & { extension: string }

export type Tool = {
    type: "TOOL",
    message: string,
    output: {
        funcCallName: string,
        funcCallResult: string,
        funcArgsAccumulate: JsonValue,
        funcCallIsError: boolean,
    }
}

export type ToolMetadata = BaseMetadata & { extension: "TOOL" }

// ---------- TEXT ---------- 

export type File = FileMetadata & {
    userId: string,
    fileType: "MEMORY" | "USER" | "EXPERIENCE",
}

export type FileMetadata = BaseMetadata & {
    category: "FILE",
    extension: "MD"
}

// ---------- TEXT ---------- 
export type Text = TextMetadata & {
    data: string,
}

export type TextMetadata = BaseMetadata & {
    category: "TEXT",
    extension: "TXT" | "MD" | "UNK"
}

// ---------- MEDIA ---------- 
export type MediaWithoutType = File | Text
export type Media = MediaWithoutType & { type: "MEDIA" }
export type MediaMetadata = FileMetadata | TextMetadata

export type Metadata = ThoughtMetadata | LogsMetadata | ToolMetadata | MediaMetadata
export type MediaData = Thought | Media | Logs | Tool | null