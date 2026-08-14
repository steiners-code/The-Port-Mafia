"use client";

import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { ChevronRight, Loader2 } from "lucide-react";
import { useMedia } from "@/hooks/use-media";
import { JsonValue } from "@/lib/types";
import { Button } from "../../ui/button";
import { STATUS } from "@/lib/enums";
import { cn } from "@/lib/utils";

const toolIcon = (status: STATUS) => {
    switch (status) {
        case STATUS.PENDING:
            return <Loader2 className="animate-spin" />
        case STATUS.COMPLETED:
            return <CheckCircleIcon weight="duotone" size={14} color="#19d44b" />
        case STATUS.FAILED:
            return <XCircleIcon weight="duotone" size={14} color="#d41919" />
    }
}

const styling = {
    "COMPLETED": "text-[#19d44b]!",
    "FAILED": "text-[#d41919]!",
    "PENDING": "text-muted-foreground!",
}

const MessageTool = ({ message, status, output }: { message: string, status: STATUS, output: JsonValue }) => {
    const { openMedia } = useMedia();

    return (
        <div className="max-w-[80%] pl-1 flex items-center justify-start! gap-1! transition-colors text-muted-foreground! hover:text-muted-foreground! group/tool">
            {toolIcon(status)}
            <p className={cn("w-fit text-left font-normal! text-sm line-clamp-1 first-letter:uppercase",
                styling[status]
            )}>
                {message}
            </p >

            <Button
                variant="link"
                className="pt-0! -mb-px! opacity-0 group-hover/tool:opacity-100 cursor-pointer text-[0.65rem]! text-muted-foreground/60! hover:text-muted-foreground!"
                onClick={() => openMedia({ message, output }, "TOOL")}
            >
                View Output
                {/* <ChevronRight size={12} className="size-3! opacity-0 group-hover/thought:opacity-100 group-hover/thought:translate-x-2 transition-all" /> */}
            </Button>
        </div>
    )
}

export default MessageTool
