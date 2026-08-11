"use client";

import { useRef } from "react"
import { MarkdownContent } from "./MarkdownContent"
import { ReplySelectionButton } from "./ReplySelectionButton"

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
