"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sendChatMessage } from "@/actions/chat/send-chat-message";
import { getChatMessages } from "@/actions/chat/get-chat-messages";
import { Chat, ChatMessage, UserSendPayload } from "@/lib/types";
import { STATUS, TRIGGER, TYPE } from "@/lib/enums";

const CHAT_QUERY_KEY = ["chat"] as const;

type MutationContext = { previousChat?: Chat };

/**
 * No SSE yet — /main/chat/send blocks until generateAIResponse finishes,
 * so by the time the mutation resolves, Dazai's reply already exists in
 * the DB. A single invalidate on success is enough to pull it in. This
 * assumption breaks if /send ever becomes fire-and-forget.
 */
export function useChat() {
    const queryClient = useQueryClient();

    const chatQuery = useQuery({
        queryKey: CHAT_QUERY_KEY,
        queryFn: async () => {
            const res = await getChatMessages();
            if (!res.success) {
                toast.error(res.message, { id: 'get-chat-message' });
                return;
            };
            return res.data;
        },
        refetchOnWindowFocus: true,
    });

    const sendMutation = useMutation({
        mutationFn: (payload: UserSendPayload) => sendChatMessage(payload),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: CHAT_QUERY_KEY });

            const previousChat = queryClient.getQueryData<Chat>(CHAT_QUERY_KEY);
            const optimisticId = `optimistic-${Date.now()}`;

            const optimisticMessage: ChatMessage = {
                id: optimisticId,
                createdAt: new Date(),
                triggerType: TRIGGER.USER,
                contents: payload.contents.map((content, index) => ({
                    id: `${optimisticId}-${index}`,
                    contentType: content.contentType,
                    status: STATUS.PENDING,
                    message: content.message ?? null,
                    output: content.output ?? null,
                    logs: null,
                    createdAt: new Date(),
                })),
            };

            queryClient.setQueryData<Chat>(CHAT_QUERY_KEY, (old) =>
                old ? { id: old.id, messages: [...old.messages, optimisticMessage] } : old
            );

            return { previousChat } satisfies MutationContext;
        },

        onSuccess: (res, _payload, context) => {
            if (!res.success) {
                if (context?.previousChat) {
                    queryClient.setQueryData(CHAT_QUERY_KEY, context.previousChat);
                }
                toast.error("Message not sent", { description: res.message });
                return;
            }

            queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEY });
        },

        onError: (_error, _payload, context) => {
            if (context?.previousChat) {
                queryClient.setQueryData(CHAT_QUERY_KEY, context.previousChat);
            }
            toast.error("Something went wrong sending your message.");
        },
    });

    function sendMessage(text: string) {
        const trimmed = text.trim();
        if (!trimmed) return;

        const payload: UserSendPayload = {
            contents: [{ contentType: TYPE.TEXT, message: trimmed }],
        };

        sendMutation.mutate(payload);
    }

    return {
        chat: chatQuery.data,
        isLoadingChat: chatQuery.isLoading,
        isChatError: chatQuery.isError,
        sendMessage,
        isPending: sendMutation.isPending,
    };
}