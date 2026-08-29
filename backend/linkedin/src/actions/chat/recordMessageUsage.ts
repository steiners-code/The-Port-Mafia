import { prisma } from "../../lib/db";

type RecordMessageUsageArgs = {
    userId: string,
    messageId: string,
    model: string,
    provider: string,
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
    toolUseTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
};

/**
 * Persists token usage against a single LinkedinMessageContent row — one
 * usage record per content block (THOUGHT/TEXT/TOOL), not aggregated
 * per turn. Call this wherever the actual SDK response usage is
 * extracted, once per completed content row (e.g. right after or
 * alongside the existing updateMessageContent call in each
 * generateXResponse's step.stop handler).
 *
 * totalTokens defaults to inputTokens + outputTokens + reasoningTokens
 * if not explicitly provided, since most SDK usage payloads either give
 * you a precomputed total or expect you to sum the parts yourself —
 * this covers both without forcing the caller to always do the math.
 */
export async function recordMessageUsage({
    userId,
    messageId,
    model,
    provider,
    inputTokens,
    outputTokens,
    cachedTokens,
    toolUseTokens,
    reasoningTokens,
    totalTokens,
}: RecordMessageUsageArgs) {
    const resolvedTotal = totalTokens ?? inputTokens + outputTokens + (reasoningTokens ?? 0);

    await prisma.linkedinMessageUsage.create({
        data: {
            userId,
            messageId,
            model,
            provider,
            inputTokens,
            outputTokens,
            cachedTokens,
            toolUseTokens,
            reasoningTokens,
            totalTokens: resolvedTotal,
        },
    });
}