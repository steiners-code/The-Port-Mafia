"use client";

import { Chat, ChatMessage, MessageContent, UserSendPayload } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sendChatMessage } from "@/actions/chat/send-chat-message";
import { getChatMessages } from "@/actions/chat/get-chat-messages";
import { getAgentByPathname } from "@/data/agents";
import { STATUS, TRIGGER } from "@/lib/enums";
import { usePathname } from "next/navigation";
import { create } from "zustand";
import { toast } from "sonner";

type ContentStore = {
    content: MessageContent[],
    setContent: (content: MessageContent[]) => void;
}

export const useContentStore = create<ContentStore>(set => ({
    content: [],
    setContent: (content) => set({ content })
}))

type MutationContext = { previousChat?: Chat };

/**
 * No SSE yet — /main/chat/send blocks until generateAIResponse finishes,
 * so by the time the mutation resolves, Dazai's reply already exists in
 * the DB. A single invalidate on success is enough to pull it in. This
 * assumption breaks if /send ever becomes fire-and-forget.
 */
export function useChat() {
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const agent = getAgentByPathname(pathname);
    const CHAT_QUERY_KEY = ["chat", agent?.id || "agent-id"] as const;

    const chatQuery = useQuery({
        queryKey: CHAT_QUERY_KEY,
        queryFn: async () => {
            const res = await getChatMessages(agent?.route || "/main");
            if (!res.success)
                toast.error(res.message, { id: 'get-chat-message' })
            return res.data;
        },
        refetchOnWindowFocus: true,
    });

    const sendMutation = useMutation({
        mutationFn: (payload: UserSendPayload) => sendChatMessage(payload, agent?.route || "/main"),

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

    function sendMessage(content: MessageContent[]) {
        const payload: UserSendPayload = {
            contents: content.map(c => ({
                contentType: c.contentType,
                message: c.message,
                output: c.output,
            }))
        };

        console.log(JSON.stringify(payload, null, 4));

        sendMutation.mutate(payload);
    }

    return {
        chat: chatQuery.data,
        isLoadingChat: chatQuery.isLoading,
        isChatError: chatQuery.isError,
        sendMessage,
        isPending: sendMutation.isPending,
        agent,
    };
}