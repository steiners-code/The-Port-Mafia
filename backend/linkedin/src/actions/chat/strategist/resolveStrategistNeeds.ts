import { StrategistNeedsResponse } from "./generateStrategistResponse";

const MAIN_SERVICE_TASK_URL = "http://mafia-main:3000/tasks/create/";

/**
 * Surfaces B's batch of questions as a Dazai-owned task rather than
 * pushing them at the principal directly — matches the task-ownership
 * model (FUTURE_DECISIONS.md §1, §7): a subordinate raises a need,
 * Dazai receives it, not the user directly. This POST creates that task
 * on the Home/main-service side; it does not itself notify the
 * principal.
 *
 * Failure here is NOT swallowed — if this call fails, B's questions
 * never reach anyone and the pipeline silently stalls waiting on
 * answers that were never asked. That's a critical failure the same way
 * a broken technique handoff was for A→B: rethrow so the harness's
 * existing fatal-error handling surfaces it as a failed message instead
 * of a silent hang.
 */
export async function resolveStrategistNeeds(needs: StrategistNeedsResponse["needs"], userId: string) {
    const response = await fetch(MAIN_SERVICE_TASK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
        },
        body: JSON.stringify({
            title: "LinkedIn post — a few things Maha needs from you",
            type: "QUESTIONNAIRE",
            subAgent: "MAHA",
            subAgentPlatform: "LINKEDIN",
            subAgentRole: "STRATEGIST",
            questions: needs,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "<unreadable response body>");
        throw new Error(`Failed to create STRATEGIST questionnaire task: ${response.status} ${response.statusText} — ${body}`);
    }

    try {
        return await response.json();
    } catch (error) {
        const rawBody = await response.text().catch(() => "<unreadable response body>");
        throw new Error(`STRATEGIST questionnaire task creation returned a 2xx but the body wasn't valid JSON: ${error instanceof Error ? error.message : "Unknown parse error"} — raw body: ${rawBody}`);
    }
}