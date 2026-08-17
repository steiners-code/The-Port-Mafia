import { MainContentStatus, MainContentType, MainMessageStatus, MainTriggerType, SubAgent } from "../generated/prisma"
import { JsonValue } from "@prisma/client/runtime/client"
import Redis from "ioredis"

const AGENT_ID = "osamu-dazai"

const publisher = new Redis(process.env.REDIS_URL!)

function channelKey(agentId: string) {
    return `sse:${agentId}`
}

export async function sendEvent(data: Event) {
    await publisher.publish(channelKey(AGENT_ID), JSON.stringify(data))
}


export type Event = MessageCreatedEvent | MessageDeltaEvent | MessageCompletedEvent | ContentCreatedEvent | ContentCompletedEvent | MessageFullEvent

type MessageFullEvent = {
    event_type: "message.full"
    message: {
        id: string,
        triggerType: MainTriggerType,
        agent: SubAgent | null,
        status: typeof MainMessageStatus.SUCCESS,
        createdAt: Date,
        contents: {
            id: string,
            contentType: MainContentType,
            sequence: number,
            message: string | null,
            output: JsonValue,
            status: MainContentStatus,
            createdAt: Date,
        }[]
    }
}

type MessageCreatedEvent = {
    event_type: "message.created"
    message: {
        id: string,
        triggerType: MainTriggerType,
        agent: SubAgent | null,
        createdAt: Date,
        status: typeof MainMessageStatus.QUEUED | typeof MainMessageStatus.SUCCESS
    }
}

type MessageDeltaEvent = {
    event_type: "message.delta"
    message: {
        id: string,
        status: typeof MainMessageStatus.PENDING
    }
}

type MessageCompletedEvent = {
    event_type: "message.completed",
    message: {
        id: string,
        status: typeof MainMessageStatus.FAILED | typeof MainMessageStatus.SUCCESS
    }
}

type ContentCreatedEvent = {
    event_type: "content.created",
    content: {
        messageId: string,
        id: string,
        contentType: MainContentType,
        sequence: number,
        message: string | null,
        output: JsonValue,
        status: typeof MainContentStatus["PENDING"] | typeof MainContentStatus["COMPLETED"],
        createdAt: Date,
    }
}

type ContentDeltaEvent = {
    event_type: "content.delta",
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: MainContentStatus
    }
}

type ContentCompletedEvent = {
    event_type: "content.completed",
    content: {
        id: string,
        message: string | null,
        output: JsonValue,
        status: MainContentStatus
    }
}