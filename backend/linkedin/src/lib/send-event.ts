import { LinkedinContentStatus, LinkedinContentType, LinkedinMessageStatus, LinkedinTriggerType } from "../generated/prisma"
import { JsonValue } from "@prisma/client/runtime/client"
import Redis from "ioredis"

const AGENT_ID = "maha-balor"

const publisher = new Redis(process.env.REDIS_URL!)

function channelKey(agentId: string) {
    return `sse:${agentId}`
}

export async function sendEvent(data: Event) {
    await publisher.publish(channelKey(AGENT_ID), JSON.stringify(data))
}


export type Event = MessageFullEvent | MessageCreatedEvent | MessageDeltaEvent | MessageCompletedEvent | MessageWipedEvent | ContentCreatedEvent | ContentCompletedEvent | ContentWipedEvent

type MessageFullEvent = {
    event_type: "message.full"
    message: {
        id: string,
        triggerType: LinkedinTriggerType,
        agent: "DAZAI" | null,
        status: typeof LinkedinMessageStatus.SUCCESS,
        createdAt: Date,
        contents: {
            id: string,
            contentType: LinkedinContentType,
            sequence: number,
            message: string | null,
            output: JsonValue,
            status: LinkedinContentStatus,
            createdAt: Date,
        }[]
    }
}

type MessageCreatedEvent = {
    event_type: "message.created"
    message: {
        id: string,
        triggerType: LinkedinTriggerType,
        agent: "DAZAI" | null,
        createdAt: Date,
        status: typeof LinkedinMessageStatus.QUEUED
    }
}

type MessageDeltaEvent = {
    event_type: "message.delta"
    message: {
        id: string,
        status: typeof LinkedinMessageStatus.PENDING
    }
}

type MessageCompletedEvent = {
    event_type: "message.completed",
    message: {
        id: string,
        status: typeof LinkedinMessageStatus.FAILED | typeof LinkedinMessageStatus.SUCCESS
    }
}

type MessageWipedEvent = {
    event_type: "message.wiped"
    message: {
        id: string
    }
}

type ContentCreatedEvent = {
    event_type: "content.created",
    content: {
        messageId: string,
        id: string,
        contentType: LinkedinContentType,
        sequence: number,
        message: string | null,
        output: JsonValue,
        status: typeof LinkedinContentStatus["PENDING"] | typeof LinkedinContentStatus["COMPLETED"],
        createdAt: Date,
    }
}

type ContentDeltaEvent = {
    event_type: "content.delta",
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: LinkedinContentStatus
    }
}

type ContentCompletedEvent = {
    event_type: "content.completed",
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: LinkedinContentStatus
    }
}

type ContentWipedEvent = {
    event_type: "content.wiped"
    content: {
        id: string,
        messageId: string
    }
}