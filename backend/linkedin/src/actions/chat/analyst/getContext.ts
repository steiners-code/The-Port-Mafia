/**
 * Pre-fetched context for the ANALYST (SOUL-A) run. Everything here costs
 * zero tool-call iterations — it is handed to the model up front so it does
 * not have to spend its budget re-discovering baseline facts it always
 * needs (last 7 days, current slot state, what exists in the bank).
 *
 * Anything beyond this — technique performance over a wider range, a
 * specific post's full content, top/bottom performers — stays behind a
 * tool call on purpose. That is what the iteration budget is for.
 */

import { prisma } from "../../../lib/db";
import { subDays } from "date-fns";

const PRE_FETCH_WINDOW_DAYS = 7;

type Last7DaysPost = {
    id: string;
    title: string;
    category: string;
    createdAt: Date;
    performance: {
        day: number;
        reactions: number;
        comments: number;
        reposts: number;
        impressions: number | null;
    }[];
    techniques: {
        role: string;
        slug: string;
    }[];
};

/**
 * Formats the last 7 days of post performance into a compact, readable
 * block. Deliberately does NOT include full post body/hook/cta text —
 * that is a `fetchPost` tool call away, since most runs will not need it
 * for every post in the window.
 */
function formatLast7DaysBlock(posts: Last7DaysPost[]): string {
    if (posts.length === 0) {
        return [
            "## Last 7 Days — Post Performance",
            "No posts exist in the last 7 days for this user.",
            "Treat this as a signal to check cold-start conditions before deciding a category.",
        ].join("\n");
    }

    const rows = posts.map((post) => {
        const techniqueSummary = post.techniques.length > 0
            ? post.techniques.map((t) => `${t.role}:${t.slug}`).join(", ")
            : "none recorded";

        const perfSummary = post.performance.length > 0
            ? post.performance
                .sort((a, b) => a.day - b.day)
                .map((p) => `day${p.day}[r:${p.reactions} c:${p.comments} rp:${p.reposts}${p.impressions !== null ? ` imp:${p.impressions}` : ""}]`)
                .join(" ")
            : "no performance captured yet";

        return [
            `- Post ${post.id} — "${post.title}" (${post.category}, posted ${post.createdAt.toISOString().slice(0, 10)})`,
            `  techniques: ${techniqueSummary}`,
            `  performance: ${perfSummary}`,
        ].join("\n");
    });

    return [
        "## Last 7 Days — Post Performance",
        `${posts.length} post(s) in this window. Full post content (hook/body/cta) is NOT included here — use the fetch_post tool if you need to read a specific post's actual copy, not just its numbers.`,
        ...rows,
    ].join("\n");
}

type SlotState = {
    category: string;
    allocated: number;
    used: number;
};

function formatSlotStateBlock(slots: SlotState[], weekStartDate: Date): string {
    if (slots.length === 0) {
        return [
            "## This Week's Slot Allocation",
            `No slot allocation exists yet for week starting ${weekStartDate.toISOString().slice(0, 10)}.`,
        ].join("\n");
    }

    const rows = slots.map(
        (s) => `- ${s.category}: ${s.used}/${s.allocated} used`
    );

    return [
        "## This Week's Slot Allocation",
        `Week starting ${weekStartDate.toISOString().slice(0, 10)}.`,
        ...rows,
    ].join("\n");
}

type TechniqueManifestEntry = {
    slug: string;
    role: string;
    category: string;
    description: string;
};

/**
 * Manifest only — slug, role, category, one-line description. NOT full
 * `content`. Knowing a technique exists costs nothing; reading its full
 * content is a deliberate tool call, since most runs only end up using a
 * handful of the full bank.
 */
function formatTechniqueManifestBlock(techniques: TechniqueManifestEntry[]): string {
    if (techniques.length === 0) {
        return [
            "## Technique Bank — Manifest",
            "The technique bank is empty. Any technique you want to use this run must go in `new_techniques`.",
        ].join("\n");
    }

    const rows = techniques.map(
        (t) => `- [${t.role}/${t.category}] ${t.slug} — ${t.description}`
    );

    return [
        "## Technique Bank — Manifest",
        "Slug, role, category, and a one_line description only. This is NOT the full technique content — use the fetch_technique_performance or fetch_technique tool if you need the full `content` for a specific slug before recommending it.",
        ...rows,
    ].join("\n");
}

/**
 * Week-boundary resolution is NOT settled yet — anchoring point (account
 * creation vs. first slot allocation vs. something else) and rollover
 * logic are an open design question, tracked separately. This resolver is
 * a placeholder that assumes the CURRENT week's LinkedinWeekSlotAllocation
 * rows already exist with the correct weekStartDate by the time this runs,
 * and just reads the most recent one rather than computing a boundary
 * itself. Replace once week-anchoring is actually decided.
 */
async function resolveCurrentWeekStartDate(userId: string): Promise<Date | null> {
    const latest = await prisma.linkedinWeekSlotAllocation.findFirst({
        where: { userId },
        orderBy: { weekStartDate: "desc" },
        select: { weekStartDate: true },
    });

    return latest?.weekStartDate ?? null;
}

export async function getAnalystContextData(userId: string): Promise<string> {
    const windowStart = subDays(new Date(), PRE_FETCH_WINDOW_DAYS);

    const weekStartDate = await resolveCurrentWeekStartDate(userId);

    const [recentPosts, slotAllocations, slotUsageRows, techniqueManifest] = await Promise.all([
        prisma.linkedinPost.findMany({
            where: { userId, createdAt: { gte: windowStart } },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                title: true,
                category: true,
                createdAt: true,
                performance: {
                    select: { day: true, reactions: true, comments: true, reposts: true, impressions: true },
                },
                techniques: {
                    select: { technique: { select: { role: true, slug: true } } },
                },
            },
        }),
        weekStartDate
            ? prisma.linkedinWeekSlotAllocation.findMany({
                where: { userId, weekStartDate },
                select: { category: true, allocated: true },
            })
            : Promise.resolve([]),
        // LinkedinSlotUsage has no userId of its own — scope through the
        // related post, which does carry userId.
        weekStartDate
            ? prisma.linkedinSlotUsage.findMany({
                where: { weekStartDate, post: { userId } },
                select: { category: true },
            })
            : Promise.resolve([]),
        prisma.linkedinTechnique.findMany({
            select: { slug: true, role: true, category: true, description: true },
        }),
    ]);

    const usedByCategory = new Map<string, number>();
    for (const row of slotUsageRows) {
        usedByCategory.set(row.category, (usedByCategory.get(row.category) ?? 0) + 1);
    }

    const slotState: SlotState[] = slotAllocations.map((a) => ({
        category: a.category,
        allocated: a.allocated,
        used: usedByCategory.get(a.category) ?? 0,
    }));

    const formattedPosts: Last7DaysPost[] = recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        createdAt: p.createdAt,
        performance: p.performance,
        techniques: p.techniques.map((t) => ({ role: t.technique.role, slug: t.technique.slug })),
    }));

    const slotBlock = weekStartDate
        ? formatSlotStateBlock(slotState, weekStartDate)
        : [
            "## This Week's Slot Allocation",
            "No slot allocation history exists yet for this user — treat this as a cold-start signal alongside the empty post history check.",
        ].join("\n");

    return [
        formatLast7DaysBlock(formattedPosts),
        "---",
        slotBlock,
        "---",
        formatTechniqueManifestBlock(techniqueManifest),
    ].join("\n");
}