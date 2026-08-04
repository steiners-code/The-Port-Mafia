"use client";

import { Metadata, useFile } from "@/hooks/use-file";
import { ChevronRight } from "lucide-react"
import { useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button"

const MessageThought = ({ message, content, metadata }: { content: string, message: string, metadata: Metadata }) => {
    const { setOpen } = useSidebar()
    const { openFile } = useFile()

    return (
        <Button
            variant="link"
            className="justify-start! gap-1! decoration-none! cursor-pointer text-muted-foreground! hover:text-foreground! group flex items-center"
            onClick={() => {
                openFile(content, metadata)
                setOpen(false)
            }}
        >
            <p className="text-left font-normal! text-sm line-clamp-1 truncate">{message}</p>
            <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </Button>
    )
}

export default MessageThought
