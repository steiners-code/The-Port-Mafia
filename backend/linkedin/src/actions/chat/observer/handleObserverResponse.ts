import { triggerWriterResponse } from "../writer/triggerWriterResponse";
import { LinkedinPostCategory } from "../../../generated/prisma";
import { MessageContext } from "../../../lib/types";

/**
 * Exact shape SOUL_D expects as input (SOUL_D.md §3): category, title,
 * the three technique notes (unchanged from what C itself received —
 * C never revises them, per its own gotchas), and facts — the
 * question/answer pairs, assembled harness-side from the task-report
 * action's already-answered Question[] rather than echoed back by the
 * model (SOUL_C's model output only ever carries narration on its
 * final turn now; facts are data the harness already has both halves
 * of, so there's no reason to spend output tokens having the model
 * restate them).
 */
export type WriterInput = {
    category: LinkedinPostCategory;
    title: string;
    hook_technique: string | null;
    body_technique: string | null;
    cta_technique: string | null;
    facts: { question: string; answer: string }[];
};

export async function handleObserverResponse(
    args: { facts: { question: string; answer: string }[] },
    category: LinkedinPostCategory,
    title: string,
    hook_technique: string | null,
    body_technique: string | null,
    cta_technique: string | null,
    context: MessageContext
) {
    try {
        const writerInput: WriterInput = {
            category,
            title,
            hook_technique,
            body_technique,
            cta_technique,
            facts: args.facts,
        };

        await triggerWriterResponse(writerInput, context);
    } catch (error) {
        // Same reasoning as handleAnalystResponse/handleStrategistResponse:
        // without real facts reaching D, there is nothing to write from
        // and the pipeline's final stage has nothing to build on.
        // Rethrow rather than swallow.
        throw error;
    }
}