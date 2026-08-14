"use client";

import { ReplySelectionButton } from "../ReplySelectionButton";
import { MarkdownContent } from "../MarkdownContent";
import { useRef } from "react";

const MessageText = ({ content }: { content: string }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

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
