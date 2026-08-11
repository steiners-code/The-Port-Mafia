"use client";

import { useTextSelection } from "@/hooks/use-text-selection";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import { MediaMetadata, Metadata } from "@/lib/types/media";
import { useContentStore } from "@/hooks/use-chat";
import { buttonVariants } from "../ui/button";
import { STATUS, TYPE } from "@/lib/enums";
import { RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
    containerRef: RefObject<HTMLDivElement | null>;
    metadata?: Metadata
};

export function ReplySelectionButton({ containerRef, metadata }: Props) {
    const { content, setContent } = useContentStore();
    const { text, rect, clear } = useTextSelection(containerRef);

    if (!text || !rect) return null;

    function handleClick() {
        setContent([...content, {
            id: crypto.randomUUID(),
            status: STATUS.COMPLETED,
            contentType: TYPE.MEDIA,
            message: null,
            logs: null,
            output: {
                data: text,
                name: metadata?.name || "text_pasted_from_previous_chat_response",
                description: metadata?.description || "",
                extension: metadata?.extension || "TXT",
                category: (metadata as MediaMetadata)?.category || "TEXT"
            },
            createdAt: new Date(),
        }])
        clear();
    }

    return (
        <button
            style={{
                position: "fixed",
                top: rect.top - 40,
                left: rect.left + rect.width / 2,
                transform: "translateX(-50%)",
            }}
            className={cn("z-50 rounded-sm! cursor-pointer",
                buttonVariants({ variant: "secondary", size: "lg" })
            )}
            onClick={handleClick}
        >
            <div className="flex items-center gap-2">
                <span>Mention</span>
                <ArrowBendUpLeftIcon />
            </div>
        </button>
    );
}