"use client";

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Chat, ChatMessage, MessageContent, UserSendPayload } from "@/lib/types";
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

type Cursor = { createdAt: Date; id: string } | undefined;

export const useContentStore = create<ContentStore>(set => ({
    content: [],
    setContent: (content) => set({ content })
}))

type MutationContext = { previousChat?: InfiniteData<Chat> };

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

    const chatQuery = useInfiniteQuery({
        queryKey: CHAT_QUERY_KEY,
        queryFn: async ({ pageParam }: { pageParam: Cursor }) => {
            const res = await getChatMessages(agent?.route || "/main", pageParam);
            if (!res.success)
                toast.error(res.message, { id: 'get-chat-message' });
            return res.data;
        },
        initialPageParam: undefined as Cursor,
        getNextPageParam: () => undefined,
        getPreviousPageParam: (firstPage) => {
            if (!firstPage?.hasMore || !firstPage.messages.length) return undefined;
            const oldest = firstPage.messages[0];
            return { createdAt: oldest.createdAt, id: oldest.id };
        },
        refetchOnWindowFocus: false,
    });

    /**
      * pages are ordered oldest-batch-first after fetchPreviousPage prepends,
      * so a flatMap in array order already yields oldest --> newest overall.
      * The newest (initially-fetched) page is always the LAST element.
      */
    const messages = chatQuery.data?.pages.flatMap(page => page?.messages ?? []) ?? [];

    const sendMutation = useMutation({
        mutationFn: (payload: UserSendPayload) => sendChatMessage(payload, agent?.route || "/main"),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: CHAT_QUERY_KEY });

            const previousChat = queryClient.getQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY);
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

            queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) => {
                if (!old || !old.pages.length) return old;
                const pages = [...old.pages];
                const lastIndex = pages.length - 1;
                const lastPage = pages[lastIndex];
                if (!lastPage) return old;
                pages[lastIndex] = { ...lastPage, messages: [...lastPage.messages, optimisticMessage] };
                return { ...old, pages };
            });

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

        sendMutation.mutate(payload);
    }

    return {
        chat: chatQuery.data,
        messages,
        isLoadingChat: chatQuery.isLoading,
        isChatError: chatQuery.isError,
        fetchOlderMessages: chatQuery.fetchPreviousPage,
        isFetchingOlder: chatQuery.isFetchingPreviousPage,
        hasOlderMessages: chatQuery.hasPreviousPage,
        sendMessage,
        isPending: sendMutation.isPending,
        agent,
    };
}