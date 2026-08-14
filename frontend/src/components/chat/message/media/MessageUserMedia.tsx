"use client";

import { useHighlightStore } from "@/hooks/use-highlight-content";
import MessageUserMediaImage from "./MessageUserMediaImage";
import MessageUserMediaText from "./MessageUserMediaText";
import { MediaWithoutType } from "@/lib/types/media";
import { XIcon } from "@phosphor-icons/react";
import { useMedia } from "@/hooks/use-media";
import { Button } from "../../../ui/button";
import { JsonValue } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UserMediaProps = {
    id: string,
    output: JsonValue,
    messageColors?: string,
    showClose?: boolean,
    removeContent?: (id: string) => void
    isUploading?: boolean,
}

const renderUserMedia = (data: MediaWithoutType, messageColors?: string) => {
    switch (data.category) {
        case "TEXT":
            return <MessageUserMediaText data={data} />
        case "IMAGE":
            return <MessageUserMediaImage data={data} messageColors={messageColors} />
    }
}

const MessageUserMedia = ({ id, output, messageColors, removeContent, showClose = false, isUploading = false }: UserMediaProps) => {
    const [opened, setOpened] = useState(false);
    const { highlightedId } = useHighlightStore();
    const { openMedia, closeMedia } = useMedia();
    const data = output as MediaWithoutType

    return (
        <div className="relative group/media-button">
            {showClose && (
                <Button
                    variant="secondary"
                    size="icon-xs"
                    className="absolute -top-2.5 -left-2.5 z-40 cursor-pointer rounded-full! group-hover/media-button:visible invisible transition-all"
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
                className={cn("w-30 aspect-square cursor-pointer border! overflow-hidden rounded-sm",
                    highlightedId === id ? "animate-border-shine" : "border-border",
                    messageColors
                )}
                onClick={() => {
                    setOpened(true);
                    openMedia(data, "MEDIA");
                }}
            >
                {isUploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 size={24} className="text-muted-foreground animate-spin" />
                    </div>
                ) : renderUserMedia(data, messageColors)}
            </div>
        </div >
    )
}

export default MessageUserMedia