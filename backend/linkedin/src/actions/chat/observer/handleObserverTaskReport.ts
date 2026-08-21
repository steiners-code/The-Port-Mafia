import { appendHistoryEntry, getHistory, getSeed } from "../../../lib/cache";
import { ObserverInput } from "../strategist/handleStrategistResponse";
import { Question } from "../../../lib/types";
import { getChatId } from "../getChatId";
import { Type } from "@google/genai";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("observer-maha-balor", { connection });

type TaskReportBody = {
    type: "QUESTIONNAIRE";
    content: Question[];
};

type ActionResult = {
    success: boolean;
    status: number;
    message: string;
    details?: string;
};

/**
 * Same reasoning as the strategist version — an unanswered question
 * (answer/answeredBy still null) is a real incomplete-report state, not
 * something to silently treat as an empty string.
 */
function cleanAnsweredQuestions(content: Question[]): Question[] {
    return content
        .filter((q) => q.answer !== null && q.answeredBy !== null)
        .sort((a, b) => a.index - b.index);
}

const ObserverFactsSchema = {
    type: Type.OBJECT,
    properties: {
        narration: {
            type: Type.STRING,
        },
    },
    required: ["narration"],
}

export async function handleObserverTaskReport(userId: string, body: TaskReportBody): Promise<ActionResult> {
    try {
        if (body.type !== "QUESTIONNAIRE") {
            return {
                success: false,
                status: 400,
                message: "Unexpected task type reported to the observer endpoint.",
                details: `Expected type "QUESTIONNAIRE", received "${body.type}".`,
            };
        }

        const answered = cleanAnsweredQuestions(body.content);

        if (answered.length === 0) {
            return {
                success: false,
                status: 400,
                message: "No answered questions were included in this report.",
                details: "content contained no entries with both answer and answeredBy set.",
            };
        }

        const observerCache = await getHistory(userId, "OBSERVER");
        if (!observerCache) {
            return {
                success: false,
                status: 404,
                message: "No in-progress observer turn found to resume.",
                details: `No cached OBSERVER history for userId=${userId} — this task may be stale or already resolved.`,
            };
        }

        const seed = await getSeed<ObserverInput>(userId, "OBSERVER");
        if (!seed) {
            return {
                success: false,
                status: 404,
                message: "No cached observer seed data found to resume this run.",
                details: `No OBSERVER seed for userId=${userId} — cannot resolve category/title/technique notes for this resumed turn.`,
            };
        }

        const { messageId } = observerCache;
        const { principalName } = await getChatId(userId);

        const facts = answered.map((q) => ({ question: q.question, answer: q.answer as string }));

        const userInputText = [
            `${principalName} has answered what you asked for. Here is what you needed:`,
            "",
            ...answered.map((q) => `Q: ${q.question}\nA: ${q.answer}`),
            "",
            "You have everything you need now. Respond with your narration only — a plain, one or two sentence note for the activity log confirming you're ready to hand this off. Don't restate the answers; the harness already has them.",
        ].join("\n");

        await appendHistoryEntry(userId, "OBSERVER", messageId, {
            type: "user_input",
            text: userInputText,
        });

        await chatQueue.add("linkedin-post", {
            messageId,
            userId,
            principalName,
            schema: ObserverFactsSchema,
            category: seed.category,
            title: seed.title,
            hook_technique: seed.hook_technique,
            body_technique: seed.body_technique,
            cta_technique: seed.cta_technique,
            facts,
        }, {
            jobId: `${messageId}-final`,
        });

        return {
            success: true,
            status: 200,
            message: "Observer answers received — finalizing facts for the writer stage.",
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to process observer task report.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}