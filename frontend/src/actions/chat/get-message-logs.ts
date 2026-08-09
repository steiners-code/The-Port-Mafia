"use server";

import { MessageContent } from "@/lib/types";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

export async function getMessageLogs(messageId: string) {
    try {
        const res = await api.get<MessageContent[] | null>(getUrl(`/main/chat/logs?messageId=${messageId}`))

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