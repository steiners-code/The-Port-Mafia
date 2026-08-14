"use server";

import { MessageContent } from "@/lib/types";
import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";
import { api } from "@/lib/api";

export async function getMessageLogs(messageId: string, agentRoute: Agent["route"]) {
    try {
        const res = await api.get<MessageContent[] | null>(getChatUrl('/logs', agentRoute), {
            params: { messageId }
        });

        return {
            success: true,
            message: "Logs retrieved successfully!",
            data: res.data
        }
    } catch (error) {
        console.log(error);

        return {
            success: true,
            message: "Unable to retrieve logs.",
            data: null
        }
    }
}