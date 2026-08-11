const MAX_RPM = Number(process.env.GEMINI_MAX_RPM) || 5;
const WINDOW_MS = 60_000;

/** Module-level — persists across every call, which is the whole point. */
const requestTimestamps: number[] = [];

/**
 * Blocks until a request slot is available, based on a rolling 60s
 * window. Call this immediately before the actual API call.
 */
export async function awaitRateLimit(): Promise<void> {
    while (true) {
        const now = Date.now();

        while (requestTimestamps.length && now - requestTimestamps[0] >= WINDOW_MS) {
            requestTimestamps.shift();
        }

        if (requestTimestamps.length < MAX_RPM) {
            requestTimestamps.push(now);
            return;
        }

        const waitMs = WINDOW_MS - (now - requestTimestamps[0]) + 50;
        await new Promise((res) => setTimeout(res, waitMs));
    }
}