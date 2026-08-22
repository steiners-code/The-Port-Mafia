const MAIN_SERVICE_TASK_URL = "http://mafia-main:3000/tasks/create/";

type PostPerformanceRequestItem = {
    postId: string;
    title: string;
};

/**
 * Requests real performance numbers from the principal for whichever
 * posts are still within their 7-day capture window. Content only
 * carries postId+title — enough for the frontend to show which posts
 * need a screenshot/number entry. day and the actual delta math happen
 * at report time (handlePostPerformanceReport), not here; this action
 * only ever asks, it never writes performance data itself.
 */
export async function requestPostPerformance(userId: string, posts: PostPerformanceRequestItem[]) {
    const response = await fetch(MAIN_SERVICE_TASK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
        },
        body: JSON.stringify({
            title: "LinkedIn post performance — numbers needed",
            type: "POST_PERFORMANCE",
            subAgent: "MAHA",
            subAgentPlatform: "LINKEDIN",
            subAgentRole: "HANDLER",
            content: posts,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "<unreadable response body>");
        throw new Error(`Failed to create POST_PERFORMANCE task: ${response.status} ${response.statusText} — ${body}`);
    }

    return response.json();
}