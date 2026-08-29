import { triggerStrategistResponse } from "../strategist/triggerStrategistResponse";
import { AnalystResponse } from "./generateAnalystResponse";
import { MessageContext } from "../../../lib/types";
import { setSeed } from "../../../lib/cache";
import { prisma } from "../../../lib/db";

/**
 * Exact shape SOUL_B expects as input (SOUL_B.md §3): category, angle,
 * and one entry per role — either a full generalized technique object,
 * or null if nothing fit. B personalizes these; it needs the real
 * description/content to mold, not just a slug string, which is why
 * this is resolved here rather than handed to B as raw slugs.
 */
type ResolvedTechnique = {
    slug: string;
    description: string;
    content: string;
};

export type StrategistInput = {
    category: AnalystResponse["category"];
    angle: string;
    hook_technique: ResolvedTechnique | null;
    body_technique: ResolvedTechnique | null;
    cta_technique: ResolvedTechnique | null;
};

/**
 * Persists any techniques the analyst proposed under new_techniques.
 * The harness creates these — never the model — per the earlier decision
 * that technique-bank persistence is mechanical, not a generation task.
 * Returns them keyed by role so a null slug for a role can be backfilled
 * from a just-created technique instead of staying null when the
 * analyst actually did propose one for that role this run.
 */
async function persistNewTechniques(newTechniques: AnalystResponse["new_techniques"]) {
    const createdByRole: Partial<Record<"HOOK" | "BODY" | "CTA", ResolvedTechnique>> = {};

    for (const technique of newTechniques) {
        const created = await prisma.linkedinTechnique.create({
            data: {
                slug: technique.slug,
                role: technique.role,
                category: technique.category,
                description: technique.description,
                content: technique.content,
            },
            select: { slug: true, description: true, content: true },
        });

        // If the analyst proposed more than one new technique for the
        // same role in a single run, the last one written wins here —
        // SOUL_A only ever asks for one technique per role downstream,
        // so this shouldn't happen in practice, but it's not the
        // harness's job to silently pick a "better" one if it does.
        createdByRole[technique.role] = created;
    }

    return createdByRole;
}

/**
 * Resolves a single role's technique for B. Priority is deliberate and
 * NOT symmetric with "prefer whichever exists":
 *
 * 1. A named an existing slug → that wins, always, even if A ALSO
 *    proposed a new technique for the same role this run. A slug being
 *    present means A judged that existing technique fits this post —
 *    the new_techniques entry for that role (if any) is a separately
 *    banked pattern for FUTURE posts, not necessarily meant for this
 *    one. Never let a same-role new technique silently override a named
 *    slug.
 * 2. Slug is null AND a new technique exists for this role → use it.
 *    Null slug means "nothing existing fit"; if A also proposed a new
 *    one for that same role, that's clearly what's meant to fill the
 *    gap this run.
 * 3. Both null/absent → genuinely null, matches SOUL_B's own
 *    null-handling rule (bank had nothing, B may originate its own
 *    guidance if the story calls for it).
 */
async function resolveTechniqueForRole(
    slug: string | null,
    role: "HOOK" | "BODY" | "CTA",
    createdByRole: Partial<Record<"HOOK" | "BODY" | "CTA", ResolvedTechnique>>
): Promise<ResolvedTechnique | null> {
    if (slug) {
        const existing = await prisma.linkedinTechnique.findUnique({
            where: { slug },
            select: { slug: true, description: true, content: true },
        });

        if (existing) {
            return existing;
        }

        // Named slug doesn't actually resolve — a hallucinated or stale
        // slug, not a legitimate "prefer new technique instead" case.
        // Falling back to a same-role new technique here ONLY because
        // the named slug was invalid, not because new_techniques
        // generally outranks a valid slug.
        return createdByRole[role] ?? null;
    }

    // Slug genuinely null — bank had nothing existing. A same-role new
    // technique, if proposed, is what fills this run's gap.
    return createdByRole[role] ?? null;
}

export async function handleAnalystResponse(args: AnalystResponse, context: MessageContext) {
    try {
        const createdByRole = await persistNewTechniques(args.new_techniques);

        const [hook_technique, body_technique, cta_technique] = await Promise.all([
            resolveTechniqueForRole(args.hook_technique_slug, "HOOK", createdByRole),
            resolveTechniqueForRole(args.body_technique_slug, "BODY", createdByRole),
            resolveTechniqueForRole(args.cta_technique_slug, "CTA", createdByRole),
        ]);

        const strategistInput: StrategistInput = {
            category: args.category,
            angle: args.angle,
            hook_technique,
            body_technique,
            cta_technique,
        };

        // Cached BEFORE triggering B — this is the source of truth
        // handleWriterResponse reads back at the very end of the run to
        // resolve which real bank slugs (existing or freshly created)
        // actually got used per role, for LinkedinPostTechnique.
        await setSeed(context.userId, "ANALYST", args)

        await triggerStrategistResponse(strategistInput, context);
    } catch (error) {
        // Persistence/resolution failures here are critical — without a
        // resolved technique set, B has nothing real to personalize and
        // the whole downstream pipeline (B, C, D) has nothing to build
        // on. Rethrow rather than swallow, so the harness's existing
        // fatal-error handling in generateAIResponse surfaces this as a
        // failed message instead of silently stalling the pipeline.
        throw error;
    }
}