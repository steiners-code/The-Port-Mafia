"use server";

import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";
import { Chat } from "@/lib/types";
import { api } from "@/lib/api";

type GetChatMessagesResult =
    | { success: true; message: string; data: Chat }
    | { success: false; message: string, data?: undefined };

export async function getChatMessages(agentRoute: Agent["route"]): Promise<GetChatMessagesResult> {
    try {
        const response = await api.get<Chat>(getChatUrl("/message", agentRoute));

        return {
            success: true,
            message: "Chat history retrieved successfully.",
            data: response.data,
        };
    } catch (error) {
        console.error("[getChatMessages]", error);

        return {
            success: false,
            message: "Couldn't retrieve chat history. Please try again.",
        };
    }
}