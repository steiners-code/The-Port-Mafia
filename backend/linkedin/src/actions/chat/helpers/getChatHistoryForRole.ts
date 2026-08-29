import { getHistory, PipelineSubAgentRole } from "../../../lib/cache";
import { createSystemContent } from "../helpers/createSystemContent";
import { LinkedinMessageContent } from "../../../generated/prisma";
import { Step } from "../../../lib/types";
import { prisma } from "../../../lib/db";

/**
 * Rebuilds a role's chat history from redis's ordered entry list, not
 * from a raw DB scan across the whole message. This is the key
 * difference from getChatHistoryForMessage (A's version): A has no
 * multi-turn history of its own to preserve, so it can safely rebuild
 * from everything under one messageId. B/C/D can share a messageId with
 * other stages on the SAME message, so rebuilding from a raw DB scan
 * would pull in content that belongs to a different role entirely.
 * Redis's per-role entry list is what keeps this scoped correctly.
 *
 * Order matters and is NOT re-derived here — redis's entries array
 * already reflects true turn order (see appendHistoryEntry), so this
 * function walks it in order rather than re-sorting by createdAt.
 */
export async function getChatHistoryForRole(role: PipelineSubAgentRole, userId: string): Promise<Step[]> {
    const cached = await getHistory(userId, role);

    // No cache for this role yet is a legitimate first-run state, not a
    // failure — this stage simply hasn't produced anything yet. Return
    // empty and let the caller's trigger function seed the first
    // user_input itself.
    if (!cached) {
        return [];
    }

    const chatHistory: Step[] = [];

    // Every contentId referenced across every "model" entry in this
    // role's history, flattened, so a single DB round-trip can resolve
    // all of them instead of one query per entry.
    const allContentIds = cached.entries
        .filter((entry): entry is { type: "model"; contentId: string[] } => entry.type === "model")
        .flatMap((entry) => entry.contentId);

    if (allContentIds.length === 0 && cached.entries.every((e) => e.type === "user_input")) {
        // Cache exists but only ever recorded user_input turns so far
        // (e.g. B asked once, is mid-flight waiting on an answer with no
        // model turn resolved yet in this bucket). Not an error — just
        // nothing to resolve from the DB.
        for (const entry of cached.entries) {
            if (entry.type === "user_input") {
                chatHistory.push({ type: "user_input", content: [{ type: "text", text: entry.text }] });
            }
        }
        return chatHistory;
    }

    let contents: LinkedinMessageContent[];
    try {
        contents = await prisma.linkedinMessageContent.findMany({
            where: { id: { in: allContentIds } },
            select: {
                id: true,
                chatMessageId: true,
                contentType: true,
                status: true,
                message: true,
                output: true,
                sequence: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [
                { createdAt: "asc" },
                { sequence: "asc" },
            ],
        });
    } catch (error) {
        // This is NOT the "no history yet" case — the cache pointed at
        // real contentIds and the DB read itself failed. The pipeline
        // cannot safely proceed on a partial/unknown history, since a
        // stage generating without its own real prior turns could
        // re-ask already-answered questions or contradict earlier
        // output. Throw rather than silently returning an empty or
        // partial history.
        throw new Error(`Unable to resolve chat history for role=${role} userId=${userId}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }

    const contentById = new Map(contents.map((c) => [c.id, c]));

    for (const entry of cached.entries) {
        if (entry.type === "user_input") {
            chatHistory.push({ type: "user_input", content: [{ type: "text", text: entry.text }] });
            continue;
        }

        // entry.type === "model" — resolve every referenced contentId,
        // in the order the cache stored them, into real system content.
        const resolvedForTurn = entry.contentId
            .map((id) => contentById.get(id))
            .filter((c): c is NonNullable<typeof c> => {
                if (!c) {
                    // A contentId the cache remembers no longer resolves
                    // in the DB. Same reasoning as above — this is a
                    // real integrity problem for a required pipeline
                    // history, not a soft-fail case.
                    throw new Error(`Cached contentId not found in DB for role=${role} userId=${userId}`);
                }
                return true;
            });

        const systemData = await createSystemContent(
            resolvedForTurn.map((c) => ({
                contentType: c.contentType,
                message: c.message,
                output: c.output,
            }))
        );

        chatHistory.push(...systemData);
    }

    return chatHistory;
}