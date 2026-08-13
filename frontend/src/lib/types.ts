import { LOGLEVEL, STATUS, TRIGGER, TYPE } from "./enums"

export type JsonValue = string | number | boolean | { [k: string]: JsonValue } | JsonValue[] | null

export type UserContentInput = {
    contentType: TYPE;
    message?: string | null;
    output?: JsonValue;
};

export type UserSendPayload = {
    contents: UserContentInput[];
};

export type Chat = {
    id: string,
    messages: ChatMessage[]
}

export type ChatMessage = {
    id: string,
    createdAt: Date,
    triggerType: TRIGGER, // "SYSTEM" | "CRON" | "USER",
    contents: MessageContent[]
}

export type MessageContent = {
    id: string,
    contentType: TYPE, // "TEXT" | "MEDIA" | "TOOL" | "THOUGHT"
    status: STATUS, // "PENDING" | "COMPLETED" | "FAILED"
    message: string | null,
    output: JsonValue,
    logs: ContentLog[] | null,
    createdAt: Date,
}

export type ContentLog = {
    id: string,
    level: LOGLEVEL, // "ERROR" | "SUCCESS" | "INFO"
    message: string,
    createdAt: Date,
}

export type Annotation = {
    end_index?: number,
    start_index?: number,
    type: "file_citation" | "place_citation" | "url_citation" | "word_info"
}