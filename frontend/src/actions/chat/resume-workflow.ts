"use server";

import { SubAgents } from "@/lib/types";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type ResumeWorkflowResult =
    | { success: true; message: string }
    | { success: false; message: string };

export async function resumeWorkflow(role: SubAgents["subAgentRole"], contentId: string, messageId: string): Promise<ResumeWorkflowResult> {
    try {
        await api.post(getUrl(`/linkedin/internal/trigger/${role.toLowerCase()}`), { contentId, messageId });

        return {
            success: true,
            message: "Workflow resumed successfully.",
        };
    } catch (error) {
        console.error("[resumeWorkflow]", error);

        return {
            success: false,
            message: "Couldn't resume the workflow. Please try again.",
        };
    }
}