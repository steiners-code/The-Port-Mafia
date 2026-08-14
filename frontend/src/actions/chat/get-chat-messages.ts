"use server";

import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";
import { Chat } from "@/lib/types";
import { api } from "@/lib/api";

export type Data = { id: Chat["id"], messages: Chat["messages"], hasMore: boolean }

type GetChatMessagesResult =
    | { success: true; message: string; data: Data }
    | { success: false; message: string, data?: undefined };

export async function getChatMessages(agentRoute: Agent["route"], cursor?: { createdAt: Date, id: string }): Promise<GetChatMessagesResult> {
    try {
        const response = await api.get<Data>(getChatUrl("/message", agentRoute), {
            params: { ...cursor }
        });

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