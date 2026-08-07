"use client";

import { TextMetadata, useMedia } from "@/hooks/use-media";
import { MarkdownContent } from "../MarkdownContent";
import { Button } from "@/components/ui/button";
import { XIcon } from "@phosphor-icons/react";
import { DotIcon } from "lucide-react";

const MediaThought = ({ metadata, content }: { metadata: TextMetadata, content: string }) => {
    const { closeMedia } = useMedia()

    return (
        <>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center">
                        <h1>{metadata.name}</h1>
                        <DotIcon size={16} className="text-muted-foreground" />
                        <h1 className="text-sm text-muted-foreground font-light">{metadata.extension}</h1>
                    </div>
                    <p className="text-xs text-muted-foreground leading-1">{metadata?.description}</p>
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={closeMedia}
                >
                    <XIcon size={18} weight="regular" />
                </Button>
            </div>

            <div className="h-[calc(100vh-56px)] overflow-auto thin-scrollbar text-foreground! p-10">
                <MarkdownContent content={content} />
            </div>
        </>
    )
}

export default MediaThought
