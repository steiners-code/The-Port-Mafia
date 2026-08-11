"use client";

import { useHighlightStore } from "@/hooks/use-highlight-content";
import { MediaMetadata } from "@/lib/types/media";
import { XIcon } from "@phosphor-icons/react";
import { useMedia } from "@/hooks/use-media";
import { JsonValue } from "@/lib/types";
import { Button } from "../ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UserMediaProps = {
    id: string,
    output: JsonValue,
    messageColors?: string,
    showClose?: boolean,
    removeContent?: (id: string) => void
}

const MessageUserMedia = ({ id, output, messageColors, removeContent, showClose = false }: UserMediaProps) => {
    const [opened, setOpened] = useState(false);
    const { highlightedId } = useHighlightStore();
    const { openMedia, closeMedia } = useMedia();
    const data = output as MediaMetadata

    return (
        <div className="relative group/media-button">
            {showClose && (
                <Button
                    variant="secondary"
                    size="icon-xs"
                    className="absolute -top-2.5 -left-2.5 z-10 cursor-pointer rounded-full! group-hover/media-button:visible invisible transition-all"
                    onClick={(e) => {
                        e.preventDefault()
                        opened && closeMedia()
                        removeContent && removeContent(id)
                    }}
                >
                    <XIcon size={8} />
                </Button>
            )}

            <div
                id={id}
                className={cn("w-30 aspect-square p-2 rounded-sm cursor-pointer",
                    "flex flex-col items-start gap-2 justify-between border",
                    highlightedId === id ? "animate-border-shine" : "border-border",
                    messageColors
                )}
                onClick={() => {
                    setOpened(true);
                    openMedia(data, "MEDIA");
                }}
            >
                <div className="flex flex-col items-start gap-2 text-sm line-clamp-2 wrap-anywhere">
                    <span className="lowercase">{data.name}</span>
                    <span className="uppercase text-xs text-muted-foreground">{data.category}/{data.extension}</span>
                </div>
            </div>
        </div>
    )
}

export default MessageUserMedia
