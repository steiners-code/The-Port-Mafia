"use client";

import { useHighlightStore } from "@/hooks/use-highlight-content";
import { ReplySelectionButton } from "../ReplySelectionButton";
import { MarkdownContent } from "../MarkdownContent";
import { Loader } from "lucide-react";
import { STATUS } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const MessageSystemAgentText = ({ status, content, id, messageColors }: { status: STATUS, content: string, id: string, messageColors?: string }) => {
    const { highlightedId } = useHighlightStore();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    if (status === STATUS.PENDING) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader size={12} className="animate-spin" />
                <span className="text-sm italic text-shine">{content}</span>
            </div>
        )
    }

    return (
        <>
            <div
                key={id}
                id={id}
                className={cn("w-full h-fit rounded-sm rounded-tl-none px-2 py-2",
                    messageColors
                )}
            >
                <div ref={chatContainerRef} className={cn("text-foreground! px-2 rounded-sm",
                    highlightedId === id && "animate-pulse-highlight",
                )}>
                    <MarkdownContent content={content} />
                </div>


                <ReplySelectionButton
                    containerRef={chatContainerRef}
                />
            </div>
        </>
    )
}

export default MessageSystemAgentText
