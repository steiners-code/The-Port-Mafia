"use client";

import { useMedia } from "@/hooks/use-media";
import { ChevronRight } from "lucide-react"
import { JsonValue } from "@/lib/types";

const MessageThought = ({ message, output }: { output: JsonValue, message: string }) => {
    const { openMedia } = useMedia();

    return (
        <div
            className="max-w-[80%] p-0! flex items-center justify-start! gap-0.5! cursor-pointer transition-colors text-muted-foreground/60! hover:text-muted-foreground! group/thought"
            onClick={() => openMedia(output, "THOUGHT")}
        >
            <p className="w-fit text-left font-normal! text-sm line-clamp-1 first-letter:uppercase">{message}</p>
            <ChevronRight size={12} className="size-3! opacity-0 group-hover/thought:opacity-100 group-hover/thought:translate-x-2 transition-all" />
        </div>
    )
}

export default MessageThought;