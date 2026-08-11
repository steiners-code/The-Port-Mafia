"use client";

import { ChatMessage, MessageContent } from "@/lib/types";
import { formatDistanceToNowStrict } from "date-fns";
import { CopyIcon } from "@phosphor-icons/react";
import { useMedia } from "@/hooks/use-media";
import MessageSystem from "./MessageSystem";
import MessageUser from "./MessageUser";
import { TRIGGER } from "@/lib/enums";
import { Button } from "../ui/button";
import { Agent } from "@/data/agents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const alignment = {
    "SYSTEM": "items-start",
    "CRON": "items-center",
    "USER": "items-end"
}

const flexDirection = {
    "SYSTEM": "flex-row",
    "CRON": "",
    "USER": "flex-row-reverse"
}

const styling = (trigger: string, messageColors?: string, textColors?: string) => {
    switch (trigger) {
        case "SYSTEM":
            return `pr-2 sm:pr-10 w-full rounded-none ${textColors}`;
        case "CRON":
            return "";
        case "USER":
            return `px-2 mb-2! sm:w-fit w-full sm:max-w-md lg:max-w-xl rounded-tr-none ${messageColors}`;
    }
}

function renderMessage(type: TRIGGER, contents: MessageContent[], agent?: Agent) {
    switch (type) {
        case TRIGGER.SYSTEM:
            return <MessageSystem contents={contents} textColors={agent?.colors.text} />
        case TRIGGER.USER:
            return <MessageUser contents={contents} messageColors={agent?.colors.message} />
        case TRIGGER.CRON:
    }
}

async function copyContent(content: (string | null)[]) {
    const text = content.filter(Boolean).join("\n\n");

    if (!text) {
        toast.error("Nothing to copy to clipboard!");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard.");
    } catch {
        toast.error("Couldn't copy, clipboard access was blocked.");
    }
}

const Message = ({ data }: { data: ChatMessage }) => {
    const { openMedia, agent } = useMedia()

    return (
        <div className={cn("w-full flex flex-col group/message", alignment[data.triggerType])}>
            {renderMessage(data.triggerType, data.contents, agent)}
            <div className={cn("flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-colors",
                flexDirection[data.triggerType]
            )}>
                <Button
                    variant="link"
                    className="text-muted-foreground/60! hover:text-muted-foreground! cursor-pointer p-0.5! text-xs! font-normal! hover:underline! underline-offset-4! capitalize"
                    onClick={() => openMedia({ messageId: data.id }, "LOGS")}
                >
                    View Logs
                </Button>

                <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-muted-foreground/60! hover:text-muted-foreground! cursor-pointer p-0.5!"
                    onClick={() => copyContent(data.contents.map(c => c.contentType === "TEXT" ? c.message : ""))}
                >
                    <CopyIcon weight="bold" className="size-3.5!" />
                </Button>

                <p className="text-xs text-muted-foreground/60 font-normal">
                    {formatDistanceToNowStrict(data.createdAt, { addSuffix: true })}
                </p>
            </div>
        </div >
    )
}

export default Message
