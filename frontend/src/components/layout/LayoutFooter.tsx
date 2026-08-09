"use client";

import { useState, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { getAgentByPathname } from "@/data/agents";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { Textarea } from "../ui/textarea";
import { ArrowUp } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const LayoutFooter = () => {
    const pathname = usePathname()
    const { sendMessage, isPending } = useChat()
    const [value, setValue] = useState<string>("")
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const agent = getAgentByPathname(pathname);

    const handleSend = () => {
        const trimmed = value.trim()
        if (!trimmed) return
        sendMessage(trimmed)
        setValue("")
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isPending) {
            e.preventDefault()
            handleSend()
            const el = e.target as HTMLTextAreaElement
            el.style.height = "auto"
        }
    }

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        const el = e.target as HTMLTextAreaElement
        el.style.height = "auto"
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }

    return (
        <div className="w-full px-4 sm:px-10 sticky bottom-0 mt-32">
            <div className="max-w-3xl w-full rounded-t-2xl mx-auto pb-4 bg-background">
                <div className={cn("relative w-full gap-2 rounded-2xl dark:bg-muted/80! px-4 py-2.5", agent?.colors.background)}>
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="react-markdown w-full max-h-60 min-h-4 mb-8 thin-scrollbar resize-none bg-transparent! border-none focus-visible:ring-0! text-sm leading-6 placeholder:text-muted-foreground"
                        placeholder="Do you have anything of concern?"
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!value.trim() || isPending}
                        aria-label="Send message"
                        className="absolute bottom-2.5 right-2.5 z-10 shrink-0 grid place-items-center h-8 w-8 rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                </div>

                <p className="max-w-fit text-muted-foreground text-xs mx-auto pt-2">{agent?.name || "This"} is an AI, {agent?.warning || "It can make mistakes while generation."}</p>
            </div>
        </div>
    )
}

export default LayoutFooter