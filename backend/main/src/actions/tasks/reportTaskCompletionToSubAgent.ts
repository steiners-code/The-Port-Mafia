import { SubAgent } from "../../generated/prisma";
import { MainTask } from "../../lib/types";

/**
 * Host is keyed by SubAgent — which service owns this agent. Route is
 * derived from subAgentRole — which pipeline stage inside that service
 * originally asked. Every SOUL variant (OBSERVER/ANALYST/STRATEGIST/
 * WRITER/HANDLER) is effectively its own entry point with its own
 * context, so the answers have to land where the question came from —
 * linkedin-service's own harness then decides whether that stage
 * consumes the answers itself or hands them forward to the next one.
 * Symmetric with the original delegation trigger, which follows the same
 * /internal/trigger/{role} shape.
 */
const SERVICE_HOSTS: Record<SubAgent, string> = {
    MAHA: "http://mafia-linkedin:3000",
};

function taskAnswersRoute(role: string) {
    return `/internal/task-report/${role.toLowerCase()}`;
}

export async function reportTaskCompletionToSubAgent(userId: string, task: MainTask) {
    const host = SERVICE_HOSTS[task.subAgent];
    if (!host) {
        throw new Error(`No internal host configured for sub-agent "${task.subAgent}".`);
    }

    const res = await fetch(`${host}${taskAnswersRoute(task.subAgentRole)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-User-Id": userId,
        },
        body: JSON.stringify({
            type: task.type,
            content: task.content,
        }),
    });

    console.log(JSON.stringify(res, null, 4))
    const blob = res.blob
    console.log(blob.toString())

    return res.ok
}