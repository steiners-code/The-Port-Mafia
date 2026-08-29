import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";
import { HarnessError } from "..";
// import { subDays } from "date-fns";

/**
 * Every ANALYST tool result carries a `message` field alongside its data,
 * even on success — not just on the empty-result path. This is
 * deliberate: a bare `{ posts: [] }` invites the model to wonder if the
 * call actually ran, and re-fire it "just in case." A plain-language
 * confirmation of what was actually checked closes that loop.
 */

// ---------------------------------------------------------------------------
// fetch_technique_performance
// ---------------------------------------------------------------------------

type FetchTechniquePerformanceArgs = {
    techniqueSlug?: string;
    role?: "HOOK" | "BODY" | "CTA";
    category?: "EDUCATIONAL" | "PERSONAL" | "BUILD_IN_PUBLIC" | "ADAPTIVE";
    startDate: string;
    endDate: string;
};

export async function fetchTechniquePerformance(args: FetchTechniquePerformanceArgs, context: ToolContext) {
    const { techniqueSlug, role, category, startDate, endDate } = args;

    if (!techniqueSlug && !role && !category) {
        throw new HarnessError("fetch_technique_performance requires at least one of techniqueSlug, role, or category to narrow the search. Calling it with none of these would return the entire bank's performance history, which isn't what this tool is for — use fetch_top_performers or fetch_bottom_performers instead if you want a broad ranked view.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new HarnessError(`Invalid date range: startDate="${startDate}", endDate="${endDate}". startDate must be before endDate, both as valid ISO dates.`);
    }

    const techniqueWhere: Record<string, unknown> = {};
    if (techniqueSlug) techniqueWhere.slug = techniqueSlug;
    if (role) techniqueWhere.role = role;
    if (category) techniqueWhere.category = category;

    const postTechniques = await prisma.linkedinPostTechnique.findMany({
        where: {
            technique: techniqueWhere,
            post: {
                userId: context.userId,
                createdAt: { gte: start, lte: end },
            },
        },
        select: {
            techniqueSlug: true,
            technique: { select: { role: true, category: true } },
            post: {
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    performance: {
                        select: { day: true, reactions: true, comments: true, reposts: true, impressions: true },
                    },
                },
            },
        },
    });

    if (postTechniques.length === 0) {
        const scope = techniqueSlug ? `slug "${techniqueSlug}"` : [role, category].filter(Boolean).join(" ");
        return {
            found: false,
            message: `No posts using a technique matching ${scope} were found between ${startDate} and ${endDate}. This technique either wasn't used in this window or doesn't exist — do not retry this exact call again; either widen the date range deliberately or treat this as a real answer (the technique has no track record here).`,
            results: [],
        };
    }

    const results = postTechniques.map((pt) => ({
        techniqueSlug: pt.techniqueSlug,
        role: pt.technique.role,
        category: pt.technique.category,
        postId: pt.post.id,
        postTitle: pt.post.title,
        postedAt: pt.post.createdAt.toISOString().slice(0, 10),
        performance: pt.post.performance
            .sort((a, b) => a.day - b.day)
            .map((p) => ({ day: p.day, reactions: p.reactions, comments: p.comments, reposts: p.reposts, impressions: p.impressions })),
    }));

    return {
        found: true,
        message: `Found ${results.length} post(s) using a matching technique between ${startDate} and ${endDate}. This is the complete set for this range — no need to re-call with the same parameters.`,
        results,
    };
}

// ---------------------------------------------------------------------------
// fetch_post
// ---------------------------------------------------------------------------

type FetchPostArgs = {
    postId: string;
};

export async function fetchPost(args: FetchPostArgs, context: ToolContext) {
    const { postId } = args;

    if (!postId) {
        throw new HarnessError("fetch_post requires a postId. You must already have this from the pre-fetched last-7-days list or a prior fetch_top_performers/fetch_bottom_performers call — this tool does not search or list posts.");
    }

    const post = await prisma.linkedinPost.findUnique({
        where: { id: postId },
        select: {
            id: true,
            userId: true,
            title: true,
            angle: true,
            category: true,
            hook: true,
            body: true,
            cta: true,
            createdAt: true,
            techniques: {
                select: { technique: { select: { slug: true, role: true, description: true } } },
            },
            performance: {
                select: { day: true, reactions: true, comments: true, reposts: true, impressions: true },
            },
        },
    });

    if (!post) {
        return {
            found: false,
            message: `No post exists with id "${postId}". This id was likely stale or mistyped — do not retry the same id, it will not resolve differently.`,
            post: null,
        };
    }

    if (post.userId !== context.userId) {
        throw new HarnessError(`Post "${postId}" does not belong to this user. Refusing to return it.`);
    }

    return {
        found: true,
        message: `Post "${postId}" fetched successfully — full content and performance below. This is the complete record; no need to re-fetch the same postId again this run.`,
        post: {
            id: post.id,
            title: post.title,
            angle: post.angle,
            category: post.category,
            hook: post.hook,
            body: post.body,
            cta: post.cta,
            postedAt: post.createdAt.toISOString().slice(0, 10),
            techniques: post.techniques.map((t) => ({
                slug: t.technique.slug,
                role: t.technique.role,
                description: t.technique.description,
            })),
            performance: post.performance
                .sort((a, b) => a.day - b.day)
                .map((p) => ({ day: p.day, reactions: p.reactions, comments: p.comments, reposts: p.reposts, impressions: p.impressions })),
        },
    };
}

// ---------------------------------------------------------------------------
// shared ranking helper for top/bottom performers
// ---------------------------------------------------------------------------

type PerformerScope = "post" | "technique";
type PerformerMetric = "reactions" | "comments" | "reposts" | "impressions";

type RankPerformersArgs = {
    scope: PerformerScope;
    metric: PerformerMetric;
    startDate: string;
    endDate: string;
    limit?: number;
};

async function rankPosts(userId: string, metric: PerformerMetric, start: Date, end: Date, limit: number, direction: "top" | "bottom") {
    const posts = await prisma.linkedinPost.findMany({
        where: { userId, createdAt: { gte: start, lte: end } },
        select: {
            id: true,
            title: true,
            category: true,
            createdAt: true,
            performance: { select: { day: true, reactions: true, comments: true, reposts: true, impressions: true } },
        },
    });

    const scored = posts
        .map((p) => {
            const total = p.performance.reduce((sum, row) => {
                const value = row[metric];
                return sum + (value ?? 0);
            }, 0);
            return { id: p.id, title: p.title, category: p.category, postedAt: p.createdAt.toISOString().slice(0, 10), totalScore: total };
        })
        .filter((p) => p.totalScore > 0 || direction === "bottom");

    scored.sort((a, b) => direction === "top" ? b.totalScore - a.totalScore : a.totalScore - b.totalScore);

    return scored.slice(0, limit);
}

async function rankTechniques(userId: string, metric: PerformerMetric, start: Date, end: Date, limit: number, direction: "top" | "bottom") {
    const postTechniques = await prisma.linkedinPostTechnique.findMany({
        where: { post: { userId, createdAt: { gte: start, lte: end } } },
        select: {
            techniqueSlug: true,
            technique: { select: { role: true, category: true } },
            post: { select: { performance: { select: { reactions: true, comments: true, reposts: true, impressions: true } } } },
        },
    });

    const byTechnique = new Map<string, { role: string; category: string; total: number; postCount: number }>();
    for (const pt of postTechniques) {
        const postTotal = pt.post.performance.reduce((sum, row) => sum + (row[metric] ?? 0), 0);
        const existing = byTechnique.get(pt.techniqueSlug);
        if (existing) {
            existing.total += postTotal;
            existing.postCount += 1;
        } else {
            byTechnique.set(pt.techniqueSlug, { role: pt.technique.role, category: pt.technique.category, total: postTotal, postCount: 1 });
        }
    }

    const scored = Array.from(byTechnique.entries()).map(([slug, v]) => ({
        techniqueSlug: slug,
        role: v.role,
        category: v.category,
        totalScore: v.total,
        postCount: v.postCount,
        averageScore: Math.round((v.total / v.postCount) * 100) / 100,
    }));

    scored.sort((a, b) => direction === "top" ? b.averageScore - a.averageScore : a.averageScore - b.averageScore);

    return scored.slice(0, limit);
}

function validateRankArgs(args: RankPerformersArgs) {
    const { scope, metric, startDate, endDate, limit } = args;

    if (scope !== "post" && scope !== "technique") {
        throw new HarnessError(`Invalid scope "${scope}". Must be "post" or "technique".`);
    }
    if (!["reactions", "comments", "reposts", "impressions"].includes(metric)) {
        throw new HarnessError(`Invalid metric "${metric}". Must be one of reactions, comments, reposts, impressions.`);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new HarnessError(`Invalid date range: startDate="${startDate}", endDate="${endDate}". startDate must be before endDate, both as valid ISO dates.`);
    }

    const resolvedLimit = limit && limit > 0 && limit <= 20 ? limit : 5;
    return { start, end, resolvedLimit };
}

// ---------------------------------------------------------------------------
// fetch_top_performers
// ---------------------------------------------------------------------------

export async function fetchTopPerformers(args: RankPerformersArgs, context: ToolContext) {
    const { start, end, resolvedLimit } = validateRankArgs(args);

    const ranked = args.scope === "post"
        ? await rankPosts(context.userId, args.metric, start, end, resolvedLimit, "top")
        : await rankTechniques(context.userId, args.metric, start, end, resolvedLimit, "top");

    if (ranked.length === 0) {
        throw new HarnessError(`No ${args.scope}s with any ${args.metric} were found between ${args.startDate} and ${args.endDate}. Do not retry this same range — either there's no data here or nothing scored above zero.`)
    }

    return {
        found: true,
        message: `Top ${ranked.length} ${args.scope}(s) by ${args.metric} between ${args.startDate} and ${args.endDate}, ranked highest first. This is the complete ranked result for this call — no need to re-run with the same parameters.`,
        results: ranked,
    };
}

// ---------------------------------------------------------------------------
// fetch_bottom_performers
// ---------------------------------------------------------------------------

export async function fetchBottomPerformers(args: RankPerformersArgs, context: ToolContext) {
    const { start, end, resolvedLimit } = validateRankArgs(args);

    const ranked = args.scope === "post"
        ? await rankPosts(context.userId, args.metric, start, end, resolvedLimit, "bottom")
        : await rankTechniques(context.userId, args.metric, start, end, resolvedLimit, "bottom");

    if (ranked.length === 0) {
        throw new HarnessError(`No ${args.scope}s were found between ${args.startDate} and ${args.endDate} to rank. Do not retry this same range — there's simply no data here.`)
    }

    return {
        found: true,
        message: `Bottom ${ranked.length} ${args.scope}(s) by ${args.metric} between ${args.startDate} and ${args.endDate}, ranked lowest first. This is the complete ranked result for this call — no need to re-run with the same parameters.`,
        results: ranked,
    };
}