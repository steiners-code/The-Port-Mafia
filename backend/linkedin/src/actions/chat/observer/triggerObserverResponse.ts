import { ObserverInput } from "../strategist/handleStrategistResponse";
import { appendHistoryEntry, setSeed } from "../../../lib/cache";
import { MessageContext } from "../../../lib/types";
import { getChatId } from "../getChatId";
import { Type } from "@google/genai";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("observer-maha-balor", { connection });

function formatTechnique(technique: string | null, role: string): string {
    if (!technique) return `${role}: null — no guidance for this role.`;
    return `${role}: ${technique}`;
}

const ObserverNeedsSchema = {
    type: Type.OBJECT,
    properties: {
        needs: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            },
        },
        narration: {
            type: Type.STRING,
        },
    },
    required: ["needs", "narration"],
}

/**
 * Same pattern as triggerStrategistResponse: C's own opening user_input
 * is built from what was just handed off (ObserverInput, from
 * handleStrategistResponse) and cached into THIS role's own bucket
 * (OBSERVER) — never mixed into STRATEGIST's history. The ANALYST-only
 * exception (caching the raw StrategistInput verbatim as JSON for later
 * category resolution) does not apply here; C's category is already
 * resolved and baked into ObserverInput itself, so nothing downstream
 * needs to re-derive it from a raw cache read the way the strategist
 * task-report action did.
 */
export async function triggerObserverResponse(input: ObserverInput, context: MessageContext) {
    try {
        const { principalName } = await getChatId(context.userId);
        const { messageId } = context;

        const userInputText = [
            `${principalName}'s title and technique notes are ready. Here is what was decided:`,
            "",
            `category: ${input.category}`,
            `title: ${input.title}`,
            "",
            formatTechnique(input.hook_technique, "hook_technique"),
            formatTechnique(input.body_technique, "body_technique"),
            formatTechnique(input.cta_technique, "cta_technique"),
            "",
            "Field guide: `title` is what this post is actually about — work out everything a full telling of it would need, not just the obvious surface question. Each technique line tells you what this particular telling is supposed to lean into, which tells you what's actually worth asking about.",
            "",
            `Your job now: figure out everything a real telling of this title needs, and ask ${principalName} for all of it in one batch — no trickling, no follow-up round. Once you have real answers, hand them forward as-is; you don't shape or judge them.`,
        ].join("\n");

        await appendHistoryEntry(context.userId, "OBSERVER", messageId, {
            type: "user_input",
            text: userInputText,
        });

        // Seeded separately from the conversational history above — the
        // task-report action (reacting to an answered task async, no
        // fresh ObserverInput argument in hand) reads this back to
        // resolve category/title/techniques for the facts-turn call.
        await setSeed(context.userId, "OBSERVER", input);

        await chatQueue.add("linkedin-post", {
            messageId,
            userId: context.userId,
            principalName,
            schema: ObserverNeedsSchema,
            category: input.category,
            title: input.title,
            hook_technique: input.hook_technique,
            body_technique: input.body_technique,
            cta_technique: input.cta_technique,
        }, {
            jobId: messageId,
        });

        return {
            success: true,
            status: 200,
            message: "Successfully initiated fact-gathering stage for Maha SOUL-C, Observer"
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to trigger SOUL-C for Maha, Observer",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}