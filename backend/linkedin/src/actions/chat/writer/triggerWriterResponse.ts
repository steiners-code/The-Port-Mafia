import { WriterInput } from "../observer/handleObserverResponse";
import { appendHistoryEntry, setSeed } from "../../../lib/cache";
import { MessageContext } from "../../../lib/types";
import { getChatId } from "../getChatId";
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const chatQueue = new Queue("writer-maha-balor", { connection });

function formatTechnique(technique: string | null, role: string): string {
    if (!technique) return `${role}: null — no guidance for this role.`;
    return `${role}: ${technique}`;
}

function formatFacts(facts: WriterInput["facts"]): string {
    if (facts.length === 0) return "No facts were gathered.";
    return facts.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
}

/**
 * D is single-turn — unlike triggerStrategistResponse/triggerObserverResponse,
 * there is no seed cache written here. D never gets resumed via a
 * task-report callback (SOUL_D has no "needs" shape at all), so there's
 * no later async caller that would need category/title/techniques
 * resolved back out of redis — everything D needs is already fully in
 * hand right here, in WriterInput, at trigger time.
 */
export async function triggerWriterResponse(input: WriterInput, context: MessageContext, jobId?: string) {
    try {
        const { principalName } = await getChatId(context.userId);
        const { messageId } = context;

        const userInputText = [
            `${principalName}'s post is ready to write. Here is everything gathered:`,
            "",
            `category: ${input.category}`,
            `title: ${input.title}`,
            `angle: ${input.angle}`,
            "",
            formatTechnique(input.hook_technique, "hook_technique"),
            formatTechnique(input.body_technique, "body_technique"),
            formatTechnique(input.cta_technique, "cta_technique"),
            "",
            "facts:",
            formatFacts(input.facts),
            "",
            "Field guide: `title` is internal context for what this post is about — never write toward it, quote it, or echo it in the post itself. Each technique line is a structural instruction for shape, not text to insert verbatim. `facts` is the real material this post is built from — never invent beyond what's here.",
            "",
            `Your job now: write the post — hook, body, cta, comment, and media — entirely in ${principalName}'s first-person voice, as though they wrote it themselves.`,
        ].join("\n");

        await appendHistoryEntry(context.userId, "WRITER", messageId, {
            type: "user_input",
            text: userInputText,
        });

        await setSeed(context.userId, "WRITER", input);

        await chatQueue.add("linkedin-post", {
            messageId,
            userId: context.userId,
            principalName,
            category: input.category,
            title: input.title,
            hook_technique: input.hook_technique,
            body_technique: input.body_technique,
            cta_technique: input.cta_technique,
            angle: input.angle,
            facts: input.facts,
        }, {
            jobId: jobId ?? messageId,
        });

        return {
            success: true,
            status: 200,
            message: "Successfully initiated writing stage for Maha SOUL-D, Writer"
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to trigger SOUL-D for Maha, Writer",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}