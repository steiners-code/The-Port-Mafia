"use client";

import { createContext, useContext } from "react";
import { useChat as useChatHook } from "@/hooks/use-chat";

type ChatContextValue = ReturnType<typeof useChatHook>;

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const chat = useChatHook();
    return (
        <ChatContext.Provider value={chat}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within ChatProvider");
    return ctx;
}