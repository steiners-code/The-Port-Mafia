import { AGENT, APPTYPE, LOGLEVEL, MESSAGESTATUS, STATUS, TASKLEVEL, TASKSTATUS, TRIGGER, TYPE } from "./enums"

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
    agent: AGENT | null, // "DAZAI" | "MAHA" etc...
    triggerType: TRIGGER, // "SYSTEM" | "CRON" | "USER"
    status: MESSAGESTATUS,
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

/**
 * Server-side event shapes published on this agent's SSE channel. Mirrors
 * the backend's Event union in sendEvent.ts — kept separate here rather
 * than shared, since frontend/backend live in different packages.
 */
export type SSEEvent = MessageCreatedEvent | MessageDeltaEvent | MessageCompletedEvent | ContentCreatedEvent | ContentCompletedEvent | MessageFullEvent

type MessageFullEvent = {
    event_type: "message.full"
    message: {
        id: string,
        agent: AGENT | null,
        triggerType: TRIGGER,
        status: typeof MESSAGESTATUS.SUCCESS,
        createdAt: Date,
        contents: {
            id: string,
            contentType: TYPE,
            sequence: number,
            message: string | null,
            output: JsonValue,
            status: STATUS,
            createdAt: Date,
        }[]
    }
}

type MessageCreatedEvent = {
    event_type: "message.created"
    message: {
        id: string,
        agent: AGENT | null,
        triggerType: TRIGGER,
        createdAt: Date,
        status: typeof MESSAGESTATUS.QUEUED | typeof MESSAGESTATUS.SUCCESS
    }
}

type MessageDeltaEvent = {
    event_type: "message.delta"
    message: {
        id: string,
        status: typeof MESSAGESTATUS.PENDING
    }
}

type MessageCompletedEvent = {
    event_type: "message.completed"
    message: {
        id: string,
        status: typeof MESSAGESTATUS.FAILED | typeof MESSAGESTATUS.SUCCESS
    }
}

type ContentCreatedEvent = {
    event_type: "content.created"
    content: {
        messageId: string,
        id: string,
        contentType: TYPE,
        sequence: number,
        message: string | null,
        output: JsonValue,
        status: typeof STATUS["PENDING"] | typeof STATUS["COMPLETED"],
        createdAt: Date,
    }
}

type ContentDeltaEvent = {
    event_type: "content.delta"
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: STATUS
    }
}

type ContentCompletedEvent = {
    event_type: "content.completed"
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: STATUS
    }
}

export type Task = {
    id: string
    title: string
    level: TASKLEVEL
    status: TASKSTATUS
    createdAt: Date,
    updatedAt: Date,
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

export type SubAgents = MahaLinkedIn | DazaiLinkedIn

type DazaiLinkedIn = {
    subAgent: typeof AGENT.MAHA
    subAgentPlatform: typeof APPTYPE.LINKEDIN
    subAgentRole: "OBSERVER" | "ANALYST" | "STRATEGIST" | "WRITER" | "HANDLER"
}

type MahaLinkedIn = {
    subAgent: typeof AGENT.MAHA
    subAgentPlatform: typeof APPTYPE.LINKEDIN
    subAgentRole: "OBSERVER" | "ANALYST" | "STRATEGIST" | "WRITER" | "HANDLER"
}