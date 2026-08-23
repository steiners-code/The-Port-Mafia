import { appendHistoryEntry, getHistory, getSeed } from "../../lib/cache";
import { StrategistInput } from "../chat/analyst/handleAnalystResponse";
import { getChatId } from "../chat/getChatId";
import { Question } from "../../lib/types";
import { Type } from "@google/genai";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("strategist-maha-balor", { connection });

type ActionResult = {
    success: boolean;
    status: number;
    message: string;
    details?: string;
};

const StrategistFinalSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
        },
        hook_technique: {
            type: Type.STRING,
            nullable: true,
        },
        body_technique: {
            type: Type.STRING,
            nullable: true,
        },
        cta_technique: {
            type: Type.STRING,
            nullable: true,
        },
        narration: {
            type: Type.STRING,
        },
    },
    required: [
        "title",
        "hook_technique",
        "body_technique",
        "cta_technique",
        "narration",
    ],
}

/**
 * Only USER- or DAZAI-answered questions are usable content for B — an
 * unanswered question (answer/answeredBy still null) means the task
 * came back incomplete, which is a real failure state, not something to
 * silently paper over by treating a missing answer as an empty string.
 */
function cleanAnsweredQuestions(content: Question[]): Question[] {
    return content
        .filter((q) => q.answer !== null && q.answeredBy !== null)
        .sort((a, b) => a.index - b.index);
}

export async function handleStrategistTaskReport(userId: string, body: Question[]): Promise<ActionResult> {
    try {
        const answered = cleanAnsweredQuestions(body);

        if (answered.length === 0) {
            return {
                success: false,
                status: 400,
                message: "No answered questions were included in this report.",
                details: "content contained no entries with both answer and answeredBy set.",
            };
        }

        const strategistCache = await getHistory(userId, "STRATEGIST");
        if (!strategistCache) {
            return {
                success: false,
                status: 404,
                message: "No in-progress strategist turn found to resume.",
                details: `No cached STRATEGIST history for userId=${userId} — this task may be stale or already resolved.`,
            };
        }

        const seed = await getSeed<StrategistInput>(userId, "STRATEGIST");
        if (!seed) {
            return {
                success: false,
                status: 404,
                message: "No cached strategist seed data found to resume this run.",
                details: `No STRATEGIST seed for userId=${userId} — cannot resolve category for this resumed turn.`,
            };
        }

        const { messageId } = strategistCache;
        const { principalName } = await getChatId(userId);
        const category = seed.category;

        const userInputText = [
            `${principalName} has answered what you asked for. Here is what you needed:`,
            "",
            ...answered.map((q) => `Q: ${q.question}\nA: ${q.answer}`),
            "",
            "Use these answers to finalize the title and personalize each technique note to it, per your output contract. If a technique role was null coming in and the story still doesn't call for one, it's fine to leave it null.",
        ].join("\n");

        await appendHistoryEntry(userId, "STRATEGIST", messageId, {
            type: "user_input",
            text: userInputText,
        });

        await chatQueue.add("linkedin-post", {
            messageId,
            userId,
            principalName,
            schema: StrategistFinalSchema,
            angle: seed.angle,
            category,
        }, {
            jobId: `${messageId}-final-${new Date().toString()}`,
        });

        return {
            success: true,
            status: 200,
            message: "Strategist answers received — finalizing title and technique notes.",
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to process strategist task report.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}