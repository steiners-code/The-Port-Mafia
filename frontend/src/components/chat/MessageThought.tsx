"use client";

import { getAgentByPathname } from "@/data/agents";
import { usePathname } from "next/navigation";
import { useMedia } from "@/hooks/use-media";
import { ChevronRight } from "lucide-react"
import { JsonValue } from "@/lib/types";
import { Button } from "../ui/button"

const MessageThought = ({ message, output }: { output: JsonValue, message: string }) => {
    const pathname = usePathname();
    const { openMedia } = useMedia();

    const agent = getAgentByPathname(pathname)

    return (
        <Button
            variant="link"
            className="justify-start! gap-1! cursor-pointer text-muted-foreground! hover:text-foreground! group flex items-center"
            onClick={() => openMedia(output, "THOUGHT", agent)}
        >
            <p className="text-left font-normal! text-sm line-clamp-1 truncate">{message}</p>
            <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </Button>
    )
}

export default MessageThought;