import { prisma } from "../../lib/db";

type PostPerformanceBody = {
    postId: string;
    reactions: number;
    comments: number;
    reposts: number;
    impressions?: number;
};

type ActionResult = {
    success: boolean;
    status: number;
    message: string;
    details?: string;
};

/**
 * Pure ingestion — MAIN owns the delta computation, timing, and
 * scheduling (per FUTURE_DECISIONS.md §5: post-level capture is
 * delta-based, screenshot-driven, resolved on MAIN's side). No AI call
 * happens here, unlike the STRATEGIST/OBSERVER task-report actions —
 * this is a straight write of whatever MAIN already resolved.
 *
 * One postId failing (not found, wrong owner) does NOT stop the rest of
 * the batch — every entry gets attempted, and failures are accumulated
 * into a single response rather than aborting on the first bad one.
 * Reads for the whole batch happen concurrently inside one
 * $transaction rather than N sequential round-trips; writes for the
 * valid entries are then issued together in a second batched call.
 */
export async function handlePostPerformanceReport(userId: string, body: PostPerformanceBody[]): Promise<ActionResult> {
    try {
        const errors: string[] = [];
        const ids = body.map(post => post.postId)

        // Phase 1: fetch every post's existing performance concurrently,
        // inside one transaction — replaces N sequential findUnique
        // calls with one round-trip.
        const existingPosts = await prisma.linkedinPost.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                userId: true,
                performance: {
                    select: {
                        comments: true,
                        impressions: true,
                        reactions: true,
                        reposts: true,
                        day: true,
                    },
                    orderBy: { capturedAt: "asc" },
                },
            },
        })

        const existingPostsById = new Map(existingPosts.map((p) => [p.id, p]));

        // Phase 2: validate + compute deltas for every entry, collecting
        // errors instead of returning early. Only entries that pass
        // validation get queued for the write phase.
        const writes: { postId: string; day: number; reactions: number; comments: number; reposts: number; impressions: number }[] = [];

        body.forEach(post => {
            const existingPost = existingPostsById.get(post.postId);

            if (!existingPost) {
                errors.push(`postId=${post.postId}: not found.`);
                return;
            }

            if (existingPost.userId !== userId) {
                errors.push(`postId=${post.postId}: belongs to a different userId.`);
                return;
            }

            const prevDay = existingPost.performance[existingPost.performance.length - 1]?.day ?? 0;
            let prevReactions = 0;
            let prevComments = 0;
            let prevReposts = 0;
            let prevImpressions = 0;

            existingPost.performance.forEach((prevPerformance) => {
                prevReactions += prevPerformance.reactions;
                prevComments += prevPerformance.comments;
                prevReposts += prevPerformance.reposts;
                prevImpressions += prevPerformance.impressions ?? 0;
            });

            writes.push({
                postId: post.postId,
                day: prevDay + 1,
                reactions: post.reactions - prevReactions,
                comments: post.comments - prevComments,
                reposts: post.reposts - prevReposts,
                impressions: (post.impressions ?? 0) - prevImpressions,
            });
        });

        // Phase 3: write every valid entry in one batched transaction —
        // replaces N sequential create calls with one round-trip.
        if (writes.length > 0) {
            await prisma.linkedinPostPerformance.createMany({
                data: writes.map((w) => ({
                    postId: w.postId,
                    day: w.day,
                    reactions: w.reactions,
                    comments: w.comments,
                    reposts: w.reposts,
                    impressions: w.impressions,
                }))
            })
        }

        if (errors.length > 0) {
            return {
                success: writes.length > 0,
                status: writes.length > 0 ? 207 : 400,
                message: writes.length > 0
                    ? `Recorded ${writes.length} of ${body.length} post(s); ${errors.length} failed.`
                    : "No post performance entries could be recorded.",
                details: errors.join(" | "),
            };
        }

        return {
            success: true,
            status: 200,
            message: `Post performance recorded for ${writes.length} post(s).`,
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to record post performance.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}