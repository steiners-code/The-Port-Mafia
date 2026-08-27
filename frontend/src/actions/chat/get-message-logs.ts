"use server";

import { MessageContent, UsageLog } from "@/lib/types";
import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";
import { api } from "@/lib/api";

type Data = {
    messageLogs: MessageContent[],
    usageLogs: UsageLog[],
}

export async function getMessageLogs(messageId: string, agentRoute: Agent["route"]) {
    try {
        const res = await api.get<Data | null>(getChatUrl('/logs', agentRoute), {
            params: { messageId }
        });

        return {
            success: true,
            message: "Logs retrieved successfully!",
            messageLogs: res.data?.messageLogs,
            usageLogs: res.data?.usageLogs
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