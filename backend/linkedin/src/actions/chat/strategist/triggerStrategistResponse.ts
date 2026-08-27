import { StrategistInput } from "../analyst/handleAnalystResponse";
import { appendHistoryEntry, setSeed } from "../../../lib/cache";
import { MessageContext } from "../../../lib/types";
import { getChatId } from "../getChatId";
import { Type } from "@google/genai";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("strategist-maha-balor", { connection });

function formatTechnique(t: StrategistInput["hook_technique"], role: string): string {
    if (!t) return `${role}: null — nothing in the bank fit this role.`;
    return [
        `${role}:`,
        `  slug: ${t.slug}`,
        `  description: ${t.description}`,
        `  content: ${t.content}`,
    ].join("\n");
}

const StrategistNeedsSchema = {
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

export async function triggerStrategistResponse(input: StrategistInput, context: MessageContext, jobId?: string) {
    try {
        const { principalName, timeZone } = await getChatId(context.userId);
        const messageId = context.messageId;

        const userInputText = [
            `${principalName}'s weekly LinkedIn analysis is complete. Here is what was decided:`,
            "",
            `category: ${input.category}`,
            `angle: ${input.angle}`,
            "",
            formatTechnique(input.hook_technique, "hook_technique"),
            "",
            formatTechnique(input.body_technique, "body_technique"),
            "",
            formatTechnique(input.cta_technique, "cta_technique"),
            "",
            "Field guide: `category` and `angle` are the direction for this week's next post — not a title, not final wording. Each technique above is either a real technique pulled from the bank, or null if nothing in the bank fit that role.",
            "",
            `Your job now: figure out exactly what you need to ask ${principalName} to turn this angle into a real, specific title — then either ask for it in one batch, or, if the angle already gives you enough, go straight to finalizing the title and personalizing each technique to it. A \`null\` technique doesn't mean skip that role — if the story calls for it, you may write your own one-off guidance for that role instead of leaving it empty.`,
        ].join("\n");

        await appendHistoryEntry(context.userId, "STRATEGIST", messageId, {
            type: "user_input",
            text: userInputText,
        });

        // Seeded separately from the conversational history above — the
        // task-report action (reacting to an answered task async, no
        // fresh StrategistInput argument in hand) reads this back to
        // resolve category for the final-turn call.
        await setSeed(context.userId, "STRATEGIST", input);

        await chatQueue.add("linkedin-post", {
            messageId,
            userId: context.userId,
            principalName,
            timeZone,
            schema: StrategistNeedsSchema,
            angle: input.angle,
            category: input.category
        }, {
            jobId: jobId ?? messageId,
        });

        return {
            success: true,
            status: 200,
            message: "Successfully initiated title & technique stage for Maha SOUL-B, Strategist"
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to trigger SOUL-B for Maha, Strategist",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}