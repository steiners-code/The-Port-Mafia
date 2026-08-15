"use client";

import { ReplySelectionButton } from "../ReplySelectionButton";
import { MarkdownContent } from "../MarkdownContent";
import { Loader } from "lucide-react";
import { STATUS } from "@/lib/enums";
import { useRef } from "react";

const MessageText = ({ status, content }: { status: STATUS, content: string }) => {
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
            <div ref={chatContainerRef} className="text-foreground!">
                <MarkdownContent content={content} />
            </div>

            <ReplySelectionButton
                containerRef={chatContainerRef}
            />
        </>
    )
}

export default MessageText
