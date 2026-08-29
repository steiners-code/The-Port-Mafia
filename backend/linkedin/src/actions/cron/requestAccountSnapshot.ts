const MAIN_SERVICE_TASK_URL = "http://mafia-main:3000/tasks/create/";

type AccountSnapshotRequestContent = {
    date: string;
};

/**
 * Requests the weekly account-level export (connections/followers) from
 * the principal. Unlike post performance, there's nothing per-item to
 * list here — one snapshot, one target date — so content is a single
 * object, not an array. The actual XLSX-row resolution and writing
 * happen at report time (handleAccountSnapshotReport), not here.
 */
export async function requestAccountSnapshot(userId: string, content: AccountSnapshotRequestContent) {
    const response = await fetch(MAIN_SERVICE_TASK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
        },
        body: JSON.stringify({
            title: "LinkedIn account snapshot — export needed",
            type: "ACCOUNT_SNAPSHOT",
            subAgent: "MAHA",
            subAgentPlatform: "LINKEDIN",
            subAgentRole: "HANDLER",
            content,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "<unreadable response body>");
        throw new Error(`Failed to create ACCOUNT_SNAPSHOT task: ${response.status} ${response.statusText} — ${body}`);
    }

    return response.json();
}