import { LinkedinPostCategory, LinkedinPostStatus, LinkedinTechniqueRole } from "../../../generated/prisma";
import { clearHistory, clearSeed, getSeed } from "../../../lib/cache";
import { AnalystResponse } from "../analyst/generateAnalystResponse";
import { displayLinkedinPost } from "../helpers/displayLinkedinPost";
import { WriterResponse } from "./generateWriterResponse";
import { MessageContext } from "../../../lib/types";
import { prisma } from "../../../lib/db";

/**
 * Terminal stage — nothing downstream to hand off to. This function's
 * only job is persistence: write the real LinkedinPost row from D's
 * output. hook_technique/body_technique/cta_technique are stored as the
 * molded strings D actually used (not slugs) per LinkedinPost's own
 * schema shape — the LinkedinPostTechnique join table (which DOES want
 * a slug) is a separate concern for whichever techniques were real bank
 * techniques versus one-off guidance B/C originated; not resolved here
 * since D's output doesn't carry slugs at all, only the molded text.
 */

type TechniqueResponse = {
    hook_technique: string | null
    body_technique: string | null
    cta_technique: string | null
}

/**
 * Resolves the REAL slug actually used for a role, replaying the exact
 * same priority rule handleAnalystResponse used when it first resolved
 * techniques for B (slug wins if present and valid; a same-role new
 * technique only fills in when the slug was null; otherwise null stays
 * null). This has to be re-derived here rather than read straight off
 * a field, because a role backfilled from new_techniques never had its
 * real slug recorded anywhere else — the analyst's own
 * hook_technique_slug/etc. would still show null for that role, since
 * that's what the model actually returned. The true slug only exists
 * inside new_techniques[i].slug for that role.
 */
function resolveSlugForRole(
    namedSlug: string | null,
    role: LinkedinTechniqueRole,
    newTechniques: AnalystResponse["new_techniques"]
): string | null {
    if (namedSlug) {
        return namedSlug;
    }

    const matchingNew = newTechniques.find((t) => t.role === role);
    return matchingNew?.slug ?? null;
}


export async function handleWriterResponse(
    args: WriterResponse,
    category: LinkedinPostCategory,
    title: string,
    angle: string | null,
    technique: TechniqueResponse,
    context: MessageContext
) {
    try {
        // TODO: weekStartDate resolution is not settled yet (see
        // WEEK_SLOT_ALLOCATION_DECISIONS.md) — placeholder read of the
        // most recent allocation, same stopgap used elsewhere until
        // that design lands.
        const latestAllocation = await prisma.linkedinWeekSlotAllocation.findFirst({
            where: { userId: context.userId },
            orderBy: { weekStartDate: "desc" },
            select: { weekStartDate: true },
        });

        if (!latestAllocation) {
            throw new Error(`No week slot allocation exists for userId=${context.userId} — cannot persist a post without a weekStartDate to attribute it to.`);
        }

        const analystSeed = await getSeed<AnalystResponse>(context.userId, "ANALYST");
        if (!analystSeed) {
            throw new Error(`No cached ANALYST seed found for userId=${context.userId} — cannot resolve real technique slugs for LinkedinPostTechnique.`);
        }

        const resolvedSlugs = {
            HOOK: resolveSlugForRole(analystSeed.hook_technique_slug, "HOOK", analystSeed.new_techniques),
            BODY: resolveSlugForRole(analystSeed.body_technique_slug, "BODY", analystSeed.new_techniques),
            CTA: resolveSlugForRole(analystSeed.cta_technique_slug, "CTA", analystSeed.new_techniques),
        };


        const post = await prisma.linkedinPost.create({
            data: {
                userId: context.userId,
                weekStartDate: latestAllocation.weekStartDate,
                category,
                title,
                angle,
                hook: args.hook,
                body: args.body,
                cta: args.cta,
                hook_technique: technique.hook_technique ?? "",
                body_technique: technique.body_technique ?? "",
                cta_technique: technique.cta_technique ?? "",
                comment: args.comment,
                mediaType: args.media.type,
                templateId: args.media.template_id,
                contentSlots: { direction: args.media.direction },
                status: LinkedinPostStatus.DRAFT,
                scheduledDay: args.scheduled_day,
                scheduledWindow: args.scheduled_window,
            },
            select: { id: true },
        });

        await displayLinkedinPost({ postId: post.id, messageId: context.messageId })

        const techniqueLinks = Object.entries(resolvedSlugs)
            .filter((entry): entry is [string, string] => entry[1] !== null)
            .map(([, slug]) => ({ postId: post.id, techniqueSlug: slug }));

        if (techniqueLinks.length > 0) {
            await prisma.linkedinPostTechnique.createMany({
                data: techniqueLinks,
                skipDuplicates: true,
            });
        }

        // Slot usage is written exactly once, exactly when a post is
        // actually created — not earlier in the pipeline, since a run
        // that fails before reaching D never consumed a real slot.
        await prisma.linkedinSlotUsage.create({
            data: {
                postId: post.id,
                weekStartDate: latestAllocation.weekStartDate,
                category,
            },
        });

        // The full A→B→C→D run is done — every role's cache (history AND
        // seed, where either exists) can be cleared now. WRITER never had
        // a seed of its own (see triggerWriterResponse), so clearSeed on
        // it is a harmless no-op, not an error.
        await Promise.all([
            clearHistory(context.userId, "ANALYST"),
            clearSeed(context.userId, "ANALYST"),
            clearHistory(context.userId, "STRATEGIST"),
            clearSeed(context.userId, "STRATEGIST"),
            clearHistory(context.userId, "OBSERVER"),
            clearSeed(context.userId, "OBSERVER"),
            clearHistory(context.userId, "WRITER"),
        ]);


        // Screen surfacing is text-only for now, media type noted but
        // not rendered — full media rendering is a later piece, per
        // explicit instruction not to build it yet. The narration text
        // itself is already written to LinkedinMessageContent by
        // generateWriterResponse's own updateMessageContent call; this
        // is only about what happens with the finished post record.
        return { postId: post.id, mediaType: args.media.type };
    } catch (error) {
        // Terminal stage — a failure here means the whole pipeline ran
        // to completion but the actual post never got saved. Rethrow so
        // the harness's existing fatal-error handling surfaces this
        // rather than silently losing a finished post.
        throw error;
    }
}