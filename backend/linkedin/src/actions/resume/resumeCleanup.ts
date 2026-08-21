import { clearHistory, clearSeed, getHistory, PipelineSubAgentRole } from "../../lib/cache";
import { sendEvent } from "../../lib/send-event";
import { prisma } from "../../lib/db";


/**
 * ANALYST is the pipeline's initiator — there is no earlier stage whose
 * context needs preserving, so a failed ANALYST run gets a full wipe:
 * the whole LinkedinChatMessage (its LinkedinMessageContent rows cascade
 * via the schema's onDelete: Cascade), plus ANALYST's own redis history
 * and seed. The caller re-triggers exactly as if this were a fresh CRON
 * fire, because that's effectively what it is.
 */
export async function wipeAnalystRun(userId: string, messageId: string) {
    await prisma.linkedinMessageContent.delete({
        where: { id: messageId }
    });

    await Promise.all([
        clearHistory(userId, "ANALYST"),
        clearSeed(userId, "ANALYST"),
    ]);

    await sendEvent({ event_type: "message.wiped", message: { id: messageId } })
}

/**
 * STRATEGIST/OBSERVER/WRITER preserve their seed (the real input data
 * needed to resume — category, title, technique notes, etc.) but need
 * their FAILED turn's content cleared before retriggering: the
 * continue-button row itself (contentId, passed in from the request),
 * plus every DB content row this role's own cached history already
 * points to — since resuming means re-running this role's generation
 * from its seed, not replaying a broken partial turn's leftover rows.
 *
 * History is cleared (not seed) — the seed is exactly what the retrigger
 * needs; the history bucket only ever held this role's OWN turns, which
 * are now being deleted anyway.
 */
export async function clearRoleContentForResume(
    userId: string,
    role: PipelineSubAgentRole,
    continueButtonContentId: string
) {
    const cached = await getHistory(userId, role);

    const modelContentIds = cached
        ? cached.entries
            .filter((e): e is { type: "model"; contentId: string[] } => e.type === "model")
            .flatMap((e) => e.contentId)
        : [];

    const idsToDelete = [continueButtonContentId, ...modelContentIds];

    await prisma.linkedinMessageContent.deleteMany({
        where: { id: { in: idsToDelete } },
    });

    await clearHistory(userId, role);

    const messageId = cached?.messageId ?? null

    idsToDelete.forEach(contentId => sendEvent({
        event_type: "content.wiped",
        content: { id: contentId, messageId: messageId ?? "" }
    }));

    return messageId;
}