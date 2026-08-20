import { triggerObserverResponse } from "../observer/triggerObserverResponse";
import { StrategistFinalResponse } from "./generateStrategistResponse";
import { LinkedinPostCategory } from "../../../generated/prisma";
import { MessageContext } from "../../../lib/types";

/**
 * Exact shape SOUL_C expects as input (SOUL_C.md §3): category, title,
 * and one entry per role — either B's molded technique note, or null if
 * that role never had guidance to mold in the first place (either the
 * bank had nothing and B chose not to originate its own note, or B did
 * originate one — either way, whatever B decided IS what C gets, C does
 * not re-derive or second-guess it).
 */
export type ObserverInput = {
    category: LinkedinPostCategory;
    title: string;
    hook_technique: string | null;
    body_technique: string | null;
    cta_technique: string | null;
};

export async function handleStrategistResponse(args: StrategistFinalResponse, category: LinkedinPostCategory, context: MessageContext) {
    try {
        const observerInput: ObserverInput = {
            category,
            title: args.title,
            hook_technique: args.hook_technique,
            body_technique: args.body_technique,
            cta_technique: args.cta_technique,
        };

        await triggerObserverResponse(observerInput, context);
    } catch (error) {
        // Same reasoning as handleAnalystResponse: without a real title
        // and technique notes reaching C, there is nothing for C to
        // gather facts against and the rest of the pipeline (C, D) has
        // nothing to build on. Rethrow rather than swallow.
        throw error;
    }
}