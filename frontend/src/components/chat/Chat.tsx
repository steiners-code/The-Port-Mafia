"use client"

import { MESSAGESTATUS, STATUS, TRIGGER, TYPE } from "@/lib/enums";
import { useScrollContainerStore } from "@/hooks/use-scroll";
import { Fragment, useEffect, useRef } from "react";
import { getAgentByPathname } from "@/data/agents";
import { useChat } from "@/context/ChatContext";
import Message from "@/components/chat/Message";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Messages from the oldest currently-loaded message at which the next
 * older page starts fetching — gives enough scroll buffer that the
 * fetch resolves before the user actually reaches the top.
 */
const SENTINEL_OFFSET = 10;

const Chat = () => {
    const pathname = usePathname();
    const { chat, messages, isLoadingChat, isChatError, fetchOlderMessages, hasOlderMessages, isFetchingOlder } = useChat();
    const container = useScrollContainerStore((s) => s.container);

    const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
    const prevScrollHeightRef = useRef<number | null>(null);
    const isFetchingOlderRef = useRef(isFetchingOlder);
    const hasOlderMessagesRef = useRef(hasOlderMessages);
    isFetchingOlderRef.current = isFetchingOlder;
    hasOlderMessagesRef.current = hasOlderMessages;

    const agent = getAgentByPathname(pathname);

    useEffect(() => {
        if (!container || !sentinelNodeRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting && hasOlderMessagesRef.current && !isFetchingOlderRef.current) {
                    prevScrollHeightRef.current = container.scrollHeight;
                    fetchOlderMessages();
                }
            },
            { root: container, threshold: 0 }
        );

        observer.observe(sentinelNodeRef.current);
        return () => observer.disconnect();
    }, [container, fetchOlderMessages, messages]);

    if (isChatError) {
        return (
            <div className="w-full h-full flex items-center justify-center gap-4">
                <h1 className="text-lg text-destructive font-semibold font-cinzel">Error</h1>
                <p className="text-muted-foreground font-normal">Something went wrong! Could'not load chat history</p>
            </div>
        )
    }

    if (!chat && isLoadingChat) {
        return (
            <div className="max-w-3xl px-4 h-full mx-auto flex flex-row items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                Loading chat history...
            </div>
        )
    }

    if (!chat || !messages || messages.length === 0) {
        return (
            <div className="max-w-3xl px-0 sm:px-2 h-full mx-auto flex flex-col items-center justify-start space-y-6">
                <Message
                    actionsDisabled={true}
                    data={{
                        id: "no-chat-history-exist-or-loaded",
                        triggerType: TRIGGER.CRON,
                        status: MESSAGESTATUS.SUCCESS,
                        createdAt: new Date(),
                        agent: null,
                        contents: [{
                            id: "no-chat-history-text-message",
                            contentType: TYPE.TEXT,
                            status: STATUS.COMPLETED,
                            message: `No Chat History with ${agent?.name || "AI"} yet. Send a message to begin!`,
                            output: null,
                            logs: null,
                            createdAt: new Date(),
                        }]
                    }} />
            </div>
        )
    }

    return (
        <div className="max-w-3xl px-0 sm:px-2 h-full mx-auto flex flex-col items-center justify-end space-y-6">
            {isFetchingOlder && (
                <div className="flex items-center justify-center py-2 text-muted-foreground">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            )}

            {messages.map((message, i) => (
                <Fragment key={message.id}>
                    {i === SENTINEL_OFFSET && <div ref={sentinelNodeRef} className="h-px w-full" />}
                    <Message data={message} />
                </Fragment>
            ))}
        </div>
    )
}

export default Chat