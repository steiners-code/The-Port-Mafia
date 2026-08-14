import { useHighlightStore } from "@/hooks/use-highlight-content";
import { File, Image, Text } from "@/lib/types/media";
import { DotIcon } from "@phosphor-icons/react";
import { useMedia } from "@/hooks/use-media";
import { Button } from "../../../ui/button";
import { cn } from "@/lib/utils";

const MessageMediaDefault = ({ output, id }: { output: File | Image | Text, id: string }) => {
    const { highlightedId } = useHighlightStore();
    const { openMedia } = useMedia();

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
                        {output.name}
                    </h1>
                    <h1 className="text-muted-foreground text-xs line-clamp-1">
                        {output.description}
                    </h1>
                </div>

                <div className="flex items-center text-sm">
                    <span>
                        {output.category}
                    </span>
                    <DotIcon size={24} />
                    <span>
                        {output.extension}
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

export default MessageMediaDefault
