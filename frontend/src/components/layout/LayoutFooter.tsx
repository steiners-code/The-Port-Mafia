"use client";

import { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent, useEffect } from "react";
import { ScrollToBottomButton } from "../chat/ScrollToBottomButton";
import { useChat, useContentStore } from "@/hooks/use-chat";
import MessageUserMedia from "../chat/MessageUserMedia";
import { useAutoScroll } from "@/hooks/use-scroll";
import { getAgentByPathname } from "@/data/agents";
import { usePathname } from "next/navigation";
import { STATUS, TYPE } from "@/lib/enums";
import { Textarea } from "../ui/textarea";
import { ArrowUp } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LayoutFooter = () => {
    const pathname = usePathname()
    const { chat, sendMessage, isPending } = useChat()
    const { content, setContent } = useContentStore();
    const { isNearBottom, scrollToBottom } = useAutoScroll(chat?.messages.length);
    const [value, setValue] = useState<string>("")
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const indexRef = useRef(0);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [value]);

    const agent = getAgentByPathname(pathname);

    const handleSend = () => {
        const trimmed = value.trim()
        if (!trimmed && content.length === 0) return

        sendMessage([...content, {
            id: 'random-ass' + new Date(),
            contentType: TYPE.TEXT,
            message: trimmed,
            output: null,
            logs: null,
            createdAt: new Date(),
            status: STATUS.COMPLETED
        }])

        setContent([])
        setValue("")
    }

    function getAsStringAsync(item: DataTransferItem): Promise<string> {
        return new Promise((resolve) => item.getAsString(resolve));
    }

    const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            indexRef.current++
            if (item.kind === "file") {
                e.preventDefault();

                if (content.length === 10) return toast.error("Media limit reached!", {
                    description: "You can not paste more than 10 files per message.",
                    id: "media-paste-limit"
                })

                const file = item.getAsFile();
                if (file) {
                    alert("TODO: Implement file upload and then save it to content.")
                }
            }

            if (item.kind === "string" && item.type === "text/plain") {
                if (content.length === 10) return
                e.preventDefault();

                const text = await getAsStringAsync(item);
                if (text.length > 4000) {
                    setContent([...content, {
                        id: crypto.randomUUID(),
                        contentType: TYPE.MEDIA,
                        status: STATUS.COMPLETED,
                        createdAt: new Date(),
                        output: {
                            name: `pasted_text_${indexRef.current}`,
                            description: "This is the text pasted by the user.",
                            extension: "TXT",
                            category: "TEXT",
                            data: text,
                        },
                        message: null,
                        logs: null
                    }])
                } else {
                    setValue(value + text)
                }
            }
        }
    };

    const removeContent = (id: string) => {
        const newContent = content.filter(c => c.id !== id);
        setContent(newContent)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isPending) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
    }

    return (
        <>
            <div className="w-full flex flex-col items-center px-4 sm:px-10 gap-8 sticky bottom-0 mt-32 z-50">
                <ScrollToBottomButton visible={!isNearBottom} onClick={() => scrollToBottom()} />

                <div className="max-w-3xl w-full rounded-t-2xl mx-auto pb-4 bg-background overflow-clip">
                    <div className={cn("w-full rounded-2xl dark:bg-muted/80!",
                        content.length !== 0 ? "transition-[height]" : "",
                        agent?.colors.background
                    )}>
                        {content.length !== 0 && (
                            <div className="w-full overflow-y-auto overflow-x-visible no-scrollbar h-fit px-4 pt-4.5 pb-3 flex flex-row items-center gap-3 flex-nowrap">
                                {content.map(c => (
                                    <MessageUserMedia
                                        key={c.id}
                                        id={c.id}
                                        output={c.output}
                                        showClose={true}
                                        removeContent={removeContent}
                                        messageColors={agent?.colors.message}
                                    />
                                ))}
                            </div>
                        )}

                        <div className={cn("relative w-full gap-2 rounded-2xl px-4 py-2.5")}>
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                rows={1}
                                className="react-markdown w-full h-fit max-h-60 min-h-4 mb-8 thin-scrollbar resize-none bg-transparent! border-none focus-visible:ring-0! text-sm leading-6 placeholder:text-muted-foreground"
                                placeholder="Do you have anything of concern?"
                            />

                            <Button
                                onClick={handleSend}
                                disabled={(!value.trim() && content?.length === 0) || isPending}
                                aria-label="Send message"
                                className="absolute bottom-2.5 right-2.5 z-10 shrink-0 grid place-items-center h-8 w-8 rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <p className="max-w-fit text-muted-foreground text-xs mx-auto pt-2">{agent?.name || "This"} is an AI, {agent?.warning || "It can make mistakes while generation."}</p>
                </div>
            </div>
        </>
    )
}

export default LayoutFooter