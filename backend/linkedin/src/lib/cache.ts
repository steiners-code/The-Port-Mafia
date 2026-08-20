import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const HISTORY_TTL_SECONDS = 60 * 60 * 24; // 24 hours — new day, new post; nothing carries over

export type PipelineSubAgentRole = "OBSERVER" | "ANALYST" | "STRATEGIST" | "WRITER" | "HANDLER";

function historyKey(userId: string, role: PipelineSubAgentRole) {
    return `pipeline:history:${userId}:${role}`;
}

export type HistoryEntry =
    | { type: "user_input"; text: string }
    | { type: "model"; contentId: string[] };

type PipelineHistory = {
    messageId: string;
    entries: HistoryEntry[];
};

/**
 * Appends one entry to THIS ROLE's history only. A's tool calls, thoughts,
 * and output never enter B's bucket, B's never enter C's, and so on —
 * each stage only ever sees its own turns here. Cross-stage handoff
 * (e.g. B receiving A's final structured output) happens through the
 * harness passing that output forward as pre-fetched context, not
 * through a shared history.
 *
 * messageId is threaded through every call rather than being part of the
 * key, since the key has to be derivable from userId+role alone BEFORE a
 * messageId necessarily exists (a fresh CRON trigger knows the user, not
 * a message it hasn't created yet).
 */
export async function appendHistoryEntry(
    userId: string,
    role: PipelineSubAgentRole,
    messageId: string,
    entry: HistoryEntry
) {
    const key = historyKey(userId, role);
    const existingRaw = await connection.get(key);
    const existing: PipelineHistory = existingRaw
        ? JSON.parse(existingRaw)
        : { messageId, entries: [] };

    existing.messageId = messageId;
    existing.entries.push(entry);

    await connection.set(key, JSON.stringify(existing), "EX", HISTORY_TTL_SECONDS);
}

/**
 * Reads this role's cached history. Returns null if nothing is cached —
 * callers should treat null as "this stage hasn't started yet, or its
 * cache already expired," not as an error. A null messageId here means
 * there's nothing to resume; the harness should treat this the same as
 * a fresh run for this role.
 */
export async function getHistory(userId: string, role: PipelineSubAgentRole): Promise<PipelineHistory | null> {
    const raw = await connection.get(historyKey(userId, role));
    return raw ? (JSON.parse(raw) as PipelineHistory) : null;
}

/**
 * Clears a single role's cached history. Call this once that specific
 * stage completes successfully and hands off to the next one — its
 * history has served its purpose (resuming an in-progress turn for
 * THIS role); the real record lives in LinkedinMessageContent via the
 * stored contentIds regardless.
 */
export async function clearHistory(userId: string, role: PipelineSubAgentRole) {
    await connection.del(historyKey(userId, role));
}

/**
 * Separate from the conversational history bucket on purpose. A stage's
 * "seed" is the identity/context data it was triggered with (category,
 * title, technique notes, etc.) — real for the harness to resolve later
 * from an async task-report callback, but NOT something that belongs
 * inside a role's own turn history, since the model would otherwise see
 * a raw data dump as if it were an actual conversational turn.
 *
 * Only needed for roles whose task-report action can't rely on a fresh
 * function argument (i.e. anything beyond ANALYST, whose seed IS its own
 * user_input verbatim already).
 */
function seedKey(userId: string, role: PipelineSubAgentRole) {
    return `pipeline:seed:${userId}:${role}`;
}

export async function setSeed(userId: string, role: PipelineSubAgentRole, seed: object) {
    await connection.set(seedKey(userId, role), JSON.stringify(seed), "EX", HISTORY_TTL_SECONDS);
}

export async function getSeed<T = unknown>(userId: string, role: PipelineSubAgentRole): Promise<T | null> {
    const raw = await connection.get(seedKey(userId, role));
    return raw ? (JSON.parse(raw) as T) : null;
}

export async function clearSeed(userId: string, role: PipelineSubAgentRole) {
    await connection.del(seedKey(userId, role));
}
