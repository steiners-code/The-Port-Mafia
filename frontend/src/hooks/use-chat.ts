"use client";

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Chat, ChatMessage, MessageContent, SSEEvent, UserSendPayload } from "@/lib/types";
import { sendChatMessage } from "@/actions/chat/send-chat-message";
import { getChatMessages } from "@/actions/chat/get-chat-messages";
import { MESSAGESTATUS, STATUS, TRIGGER } from "@/lib/enums";
import { getAgentByPathname } from "@/data/agents";
import { usePathname } from "next/navigation";
import { useSSE } from "./use-sse";
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
 * Mutates a message across all cached pages by id, applying `update` to
 * whichever page actually contains it. Returns the original cache
 * reference untouched if the message isn't found anywhere, so callers
 * that receive an event for a not-yet-cached message (a race on first
 * load) don't crash — they just no-op.
 */
function updateMessageInCache(
    old: InfiniteData<Chat> | undefined,
    messageId: string,
    update: (message: ChatMessage) => ChatMessage
): InfiniteData<Chat> | undefined {
    if (!old) return old;

    let found = false;
    const pages = old.pages.map((page) => {
        if (!page) return page;
        const messages = page.messages.map((m) => {
            if (m.id !== messageId) return m;
            found = true;
            return update(m);
        });
        return found ? { ...page, messages } : page;
    });

    if (!found) return old;
    return { ...old, pages };
}

function appendMessageToCache(old: InfiniteData<Chat> | undefined, message: ChatMessage): InfiniteData<Chat> | undefined {
    if (!old || !old.pages.length) return old;

    const pages = [...old.pages];
    const lastIndex = pages.length - 1;
    const lastPage = pages[lastIndex];
    if (!lastPage) return old;

    const alreadyExists = lastPage.messages.some((m) => m.id === message.id);
    if (alreadyExists) return old;

    pages[lastIndex] = { ...lastPage, messages: [...lastPage.messages, message] };
    return { ...old, pages };
}

/**
 * SSE now owns the live view of a conversation: the user's own send still
 * gets an optimistic bubble and a real-row reconciliation on mutation
 * success, but the agent's reply — creation, status transitions, content
 * blocks — arrives entirely through these events. No polling, no blanket
 * invalidate once a message exists.
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

    function handleEvent(event: SSEEvent) {
        switch (event.event_type) {
            case "message.created": {
                const message: ChatMessage = {
                    id: event.message.id,
                    createdAt: event.message.createdAt,
                    triggerType: event.message.triggerType,
                    status: event.message.status,
                    contents: [],
                };

                queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) =>
                    appendMessageToCache(old, message)
                );
                break;
            }

            case "message.delta":
            case "message.completed": {
                queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) =>
                    updateMessageInCache(old, event.message.id, (m) => ({
                        ...m,
                        status: event.message.status,
                    }))
                );
                break;
            }

            case "content.created": {
                const content: MessageContent = {
                    id: event.content.id,
                    contentType: event.content.contentType as MessageContent["contentType"],
                    status: event.content.status as MessageContent["status"],
                    message: event.content.message,
                    output: event.content.output as MessageContent["output"],
                    logs: null,
                    createdAt: new Date(event.content.createdAt),
                };
                queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) =>
                    updateMessageInCache(old, event.content.messageId, (m) => ({
                        ...m,
                        contents: [...m.contents, content],
                    }))
                );
                break;
            }

            case "content.completed": {
                queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) => {
                    if (!old) return old;
                    const pages = old.pages.map((page) => {
                        if (!page) return page;
                        const messages = page.messages.map((m) => ({
                            ...m,
                            contents: m.contents.map((c) =>
                                c.id === event.content.id
                                    ? { ...c, status: event.content.status as MessageContent["status"], message: event.content.message, output: event.content.output as MessageContent["output"] }
                                    : c
                            ),
                        }));
                        return { ...page, messages };
                    });
                    return { ...old, pages };
                });
                break;
            }
        }
    }

    useSSE<SSEEvent>(agent?.route || "/main", handleEvent);

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
                status: MESSAGESTATUS.SUCCESS,
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

            queryClient.setQueryData<InfiniteData<Chat>>(CHAT_QUERY_KEY, (old) =>
                appendMessageToCache(old, optimisticMessage)
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
            };
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
        isPending: sendMutation.isPending || messages[messages.length - 1]?.status === MESSAGESTATUS.PENDING || messages[messages.length - 1]?.status === MESSAGESTATUS.QUEUED,
        agent,
    };
}