"use client";

import { ReplySelectionButton } from "../ReplySelectionButton";
import { MarkdownContent } from "../MarkdownContent";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { STATUS } from "@/lib/enums";
import { cn } from "@/lib/utils";

const MessageText = ({ status, content, hideExcess = false }: { status: STATUS, content: string, hideExcess?: boolean }) => {
    const [showMore, setShowMore] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!hideExcess || !chatContainerRef.current) return;

        const el = chatContainerRef.current;
        // scrollHeight is the full unclamped content height;
        // clientHeight is what's actually visible under line-clamp.
        // If scrollHeight > clientHeight, real overflow happened,
        // regardless of character count or how many linebreaks caused it.
        setIsOverflowing(el.scrollHeight > el.clientHeight);
    }, [content, hideExcess]);

    if (status === STATUS.PENDING) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm italic text-shine bg-">{content}</span>
            </div>
        )
    }

    return (
        <>
            <div ref={chatContainerRef} className={cn("text-foreground!", (hideExcess && !showMore) ? "line-clamp-6" : "")}>
                <MarkdownContent content={content} />
            </div>

            {(hideExcess && isOverflowing) && (
                <div className="w-full flex items-center justify-end">
                    <Button
                        size="xs"
                        variant="link"
                        className="text-[0.65rem]! h-fit! m-0! p-0! ml-auto! cursor-pointer text-muted-foreground/80! hover:text-foreground/80!"
                        onClick={() => setShowMore(prev => !prev)}
                    >
                        {!showMore ? "Show More" : "Show Less"}
                    </Button>
                </div>
            )}

            <ReplySelectionButton
                containerRef={chatContainerRef}
            />
        </>
    )
}

export default MessageText
