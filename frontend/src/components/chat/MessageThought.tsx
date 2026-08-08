"use client";

import { useMedia } from "@/hooks/use-media";
import { ChevronRight } from "lucide-react"
import { JsonValue } from "@/lib/types";
import { Button } from "../ui/button"

const MessageThought = ({ message, output }: { output: JsonValue, message: string }) => {
    const { openMedia } = useMedia();

    return (
        <Button
            variant="link"
            className="justify-start! gap-0.5! cursor-pointer text-muted-foreground! hover:text-foreground! group flex items-center"
            onClick={() => openMedia(output, "THOUGHT")}
        >
            <p className="text-left font-normal! text-sm line-clamp-1 truncate">{message}</p>
            <ChevronRight size={12} className="size-3! group-hover:translate-x-2 transition-transform" />
        </Button>
    )
}

export default MessageThought;