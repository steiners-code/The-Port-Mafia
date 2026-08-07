"use server";

import { getUrl } from "@/lib/utils";
import { Chat } from "@/lib/types";
import { api } from "@/lib/api";

type GetChatMessagesResult =
    | { success: true; message: string; data: Chat }
    | { success: false; message: string; details?: string; data?: undefined };

export async function getChatMessages(): Promise<GetChatMessagesResult> {
    try {
        const response = await api.get<Chat>(getUrl("/main/chat/message"));

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