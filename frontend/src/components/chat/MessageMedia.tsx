"use client"

import { useHighlightStore } from "@/hooks/use-highlight-content";
import { DotIcon } from "@phosphor-icons/react";
import { useMedia } from "@/hooks/use-media";
import { File } from "@/lib/types/media";
import { JsonValue } from "@/lib/types"
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const MessageMedia = ({ output, id }: { output: JsonValue, id: string }) => {
    const { openMedia } = useMedia();
    const { highlightedId } = useHighlightStore();

    if (typeof output !== "object" || Array.isArray(output))
        return;

    const data = output as File;

    return (
        <div
            className={cn("w-full border rounded-sm bg-accent p-4 my-2 cursor-pointer flex items-center justify-between",
                highlightedId === id ? "animate-border-shine" : "border-border"
            )}
            onClick={() => openMedia(output, "MEDIA")}
        >
            <div className="w-2/3 flex flex-col items-start gap-2">
                <div className="flex flex-col">
                    <h1 className="text-foreground font-serif text-lg">
                        {data.name}
                    </h1>
                    <h1 className="text-muted-foreground text-xs line-clamp-1">
                        {data.description}
                    </h1>
                </div>

                <div className="flex items-center text-sm">
                    <span>
                        {data.category}
                    </span>
                    <DotIcon size={24} />
                    <span>
                        {data.extension}
                    </span>
                </div>
            </div>

            <Button
                variant="secondary"
                onClick={() => alert("TODO: Implement Download")}
            >
                Download
            </Button>
        </div>
    )
}

export default MessageMedia
