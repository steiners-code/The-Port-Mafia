import { Annotation, JsonValue, SubAgents } from "../types"
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

export type ThoughtMetadata = BaseMetadata & {
    category: "THOUGHT"
    extension: "THOUGHT"
}

// ---------- LOGS ---------- 

export type Logs = {
    type: "LOGS"
    messageId: string,
}

export type LogsMetadata = BaseMetadata & {
    category: "LOGS",
    extension: string
}

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

export type ToolMetadata = BaseMetadata & {
    category: "TOOL"
    extension: "TOOL"
}

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

// ---------- IMAGE ---------- 
export type Image = ImageMetadata & {
    uri: string,
}

export type ImageMetadata = BaseMetadata & {
    category: "IMAGE",
    extension: "PNG" | "JPEG" | "WEBP" | "HEIC" | "HEIF" | "GIF" | "BMP" | "TIFF" | (string & {}),
}

// ---------- TASK ---------- 
export type Task = TaskMetadata & {
    id: string,
}

export type TaskMetadata = BaseMetadata & {
    category: "TASK",
    extension: "QUESTIONNAIRE" | "POST_PERFORMANCE" | "ACCOUNT_SNAPSHOT",
}

// ---------- ACTION ---------- 
export type Action = { category: "ACTION" } & ComponentAction

// ---------- COMPONENT ---------- 
export type ComponentAction = { actionType: "COMPONENT" } & (LinkedinConnectComponent | LinkedinContinueComponent | LinkedinPostComponent)

export type LinkedinConnectComponent = {
    name: "LinkedinConnectButton"
    message?: string
}

export type LinkedinContinueComponent = {
    name: "LinkedinContinueButton"
    message: string
    role: SubAgents["subAgentRole"]
}

export type LinkedinPostComponent = {
    name: "LinkedinPost"
    postId: string
}

// ---------- MEDIA ---------- 
export type MediaWithoutType = File | Text | Image | Task
export type MediaWithAction = MediaWithoutType | Action
export type Media = MediaWithoutType & { type: "MEDIA" }
export type MediaMetadata = FileMetadata | TextMetadata | ImageMetadata

export type Metadata = ThoughtMetadata | LogsMetadata | ToolMetadata | TaskMetadata | MediaMetadata
export type MediaData = Thought | Media | Logs | Tool | (Task & { type: "TASK" }) | null