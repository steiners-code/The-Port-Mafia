"use client"

import { STATUS, TRIGGER, TYPE } from "@/lib/enums";
import { getAgentByPathname } from "@/data/agents";
import Message from "@/components/chat/Message";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { Loader2 } from "lucide-react";

const Chat = () => {
    const pathname = usePathname();
    const { chat, isLoadingChat, isChatError } = useChat();

    const agent = getAgentByPathname(pathname);

    if (isChatError) {
        return (
            <div className="max-w-3xl px-4 h-full mx-auto flex flex-col items-center justify-end space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start gap-2">
                        <h1 className="text-lg text-destructive font-semibold font-cinzel">Error</h1>
                        <p className="text-muted-foreground font-normal">Something went wrong! Could'not load chat history</p>
                    </div>
                </div>
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

    if (!chat || chat?.messages.length === 0) {
        return (
            <div>
                <Message data={{
                    id: "no-chat-history-exist-or-loaded",
                    triggerType: TRIGGER.CRON,
                    createdAt: new Date(),
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
        <>
            <div className="max-w-3xl px-0 sm:px-2 h-full mx-auto flex flex-col items-center justify-end space-y-6">
                {chat.messages.map(message => (
                    <Message key={message.id} data={message} />
                ))}
            </div>
        </>
    )
}

export default Chat
