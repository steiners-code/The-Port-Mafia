import { triggerStrategistResponse } from "../chat/strategist/triggerStrategistResponse";
import { triggerObserverResponse } from "../chat/observer/triggerObserverResponse";
import { triggerWriterResponse } from "../chat/writer/triggerWriterResponse";
import { ObserverInput } from "../chat/strategist/handleStrategistResponse";
import { clearRoleContentForResume, wipeAnalystRun } from "./resumeCleanup";
import { StrategistInput } from "../chat/analyst/handleAnalystResponse";
import { WriterInput } from "../chat/observer/handleObserverResponse";
import { getChatId } from "../chat/getChatId";
import { getSeed } from "../../lib/cache";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("analyst-maha-balor", { connection });

type ActionResult = {
    success: boolean;
    status: number;
    message: string;
    details?: string;
};

/**
 * ANALYST resume — full wipe, no seed to fetch (ANALYST has no upstream
 * seed of its own; it's the initiator). contentId isn't used for a
 * targeted delete here since the whole message is being removed anyway
 * — accepted for a consistent call signature across all four resume
 * actions, not because ANALYST needs it.
 */
export async function resumeAnalyst(userId: string, contentId: string, messageId: string): Promise<ActionResult> {
    try {
        await wipeAnalystRun(userId, messageId);

        const { principalName } = await getChatId(userId);
        await chatQueue.add("linkedin-post", {
            messageId: messageId,
            userId,
            principalName,
        }, {
            jobId: `${messageId}-${contentId}`,
        });

        return {
            success: true,
            status: 200,
            message: "Added analysis to Queue Successfully!",
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to resume ANALYST.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}

export async function resumeStrategist(userId: string, contentId: string): Promise<ActionResult> {
    try {
        const messageId = await clearRoleContentForResume(userId, "STRATEGIST", contentId);
        if (!messageId) {
            return {
                success: false,
                status: 404,
                message: "No in-progress strategist run found to resume.",
                details: `No cached STRATEGIST history for userId=${userId}.`,
            };
        }

        const seed = await getSeed<StrategistInput>(userId, "STRATEGIST");
        if (!seed) {
            return {
                success: false,
                status: 404,
                message: "No cached strategist seed data found to resume.",
                details: `No STRATEGIST seed for userId=${userId}.`,
            };
        }

        const jobId = `${messageId}-${contentId}`
        const result = await triggerStrategistResponse(seed, { userId, messageId }, jobId);

        return {
            success: result.success,
            status: result.status,
            message: result.message,
            details: "details" in result ? result.details : undefined,
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to resume STRATEGIST.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}

export async function resumeObserver(userId: string, contentId: string): Promise<ActionResult> {
    try {
        const messageId = await clearRoleContentForResume(userId, "OBSERVER", contentId);
        if (!messageId) {
            return {
                success: false,
                status: 404,
                message: "No in-progress observer run found to resume.",
                details: `No cached OBSERVER history for userId=${userId}.`,
            };
        }

        const seed = await getSeed<ObserverInput>(userId, "OBSERVER");
        if (!seed) {
            return {
                success: false,
                status: 404,
                message: "No cached observer seed data found to resume.",
                details: `No OBSERVER seed for userId=${userId}.`,
            };
        }

        const jobId = `${messageId}-${contentId}`
        const result = await triggerObserverResponse(seed, { userId, messageId }, jobId);

        return {
            success: result.success,
            status: result.status,
            message: result.message,
            details: "details" in result ? result.details : undefined,
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to resume OBSERVER.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}

export async function resumeWriter(userId: string, contentId: string): Promise<ActionResult> {
    try {
        const messageId = await clearRoleContentForResume(userId, "WRITER", contentId);
        if (!messageId) {
            return {
                success: false,
                status: 404,
                message: "No in-progress writer run found to resume.",
                details: `No cached WRITER history for userId=${userId}.`,
            };
        }

        const seed = await getSeed<WriterInput>(userId, "WRITER");
        if (!seed) {
            return {
                success: false,
                status: 404,
                message: "No cached writer seed data found to resume.",
                details: `No WRITER seed for userId=${userId} — WRITER needs to start writing a seed on trigger for resume to work.`,
            };
        }

        const jobId = `${messageId}-${contentId}`
        const result = await triggerWriterResponse(seed, { userId, messageId }, jobId);

        return {
            success: result.success,
            status: result.status,
            message: result.message,
            details: "details" in result ? result.details : undefined,
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to resume WRITER.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}