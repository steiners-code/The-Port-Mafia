"use server";

import { SubAgents } from "@/lib/types";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type ResumeWorkflowResult = { message: string }

export async function resumeWorkflow(role: SubAgents["subAgentRole"], contentId: string, messageId: string): Promise<ResumeWorkflowResult> {
    try {
        await api.post(getUrl(`/linkedin/internal/trigger/${role.toLowerCase()}`), { contentId, messageId });

        return { message: "Workflow resumed successfully." };
    } catch (error) {
        console.error("[resumeWorkflow]", error);
        throw new Error("Couldn't resume the workflow. Please try again.")
    }
}