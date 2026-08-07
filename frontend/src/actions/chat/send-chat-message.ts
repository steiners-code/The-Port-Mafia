"use server";

import { UserSendPayload } from "@/lib/types";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type SendChatMessageResult =
    | { success: true; message: string }
    | { success: false; message: string };

/**
 * Rejects the payload before it ever reaches the network if it violates
 * the content rules. This mirrors the guard in useChat's sendMessage,
 * but the action can be called independent of the hook, so it re-checks
 * rather than trusting the caller.
 */
function isValidPayload(payload: UserSendPayload): boolean {
    if (payload.contents.length === 0) return false;

    return payload.contents.every((content) => {
        if (content.type === "TEXT") return Boolean(content.message?.trim());
        return true;
    });
}

export async function sendChatMessage(payload: UserSendPayload): Promise<SendChatMessageResult> {
    if (!isValidPayload(payload)) {
        return {
            success: false,
            message: "A message needs at least one non-empty text or media entry.",
        };
    }

    try {
        await api.post(getUrl("/main/chat/send"), payload);

        return {
            success: true,
            message: "Message sent successfully.",
        };
    } catch (error) {
        console.error("[sendChatMessage]", error);

        return {
            success: false,
            message: "Couldn't send your message. Please try again.",
        };
    }
}