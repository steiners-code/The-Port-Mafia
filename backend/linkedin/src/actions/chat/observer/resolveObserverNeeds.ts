import { ObserverNeedsResponse } from "./generateObserverResponse";

const MAIN_SERVICE_TASK_URL = "http://mafia-main:3000/tasks/create/";

/**
 * Same reasoning as resolveStrategistNeeds — surfaces C's batch of
 * questions as a Dazai-owned task rather than pushing them at the
 * principal directly. Failure here is rethrown, not swallowed, for the
 * same reason: if this call fails, C's questions never reach anyone and
 * the pipeline silently stalls.
 */
export async function resolveObserverNeeds(needs: ObserverNeedsResponse["needs"], userId: string) {
    const response = await fetch(MAIN_SERVICE_TASK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
        },
        body: JSON.stringify({
            title: "LinkedIn post — a few facts Maha needs from you",
            type: "QUESTIONNAIRE",
            subAgent: "MAHA",
            subAgentPlatform: "LINKEDIN",
            subAgentRole: "OBSERVER",
            questions: needs,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "<unreadable response body>");
        throw new Error(`Failed to create OBSERVER questionnaire task: ${response.status} ${response.statusText} — ${body}`);
    }

    return response.json();
}