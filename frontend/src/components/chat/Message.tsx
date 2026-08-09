"use client";

import { ChatMessage, MessageContent } from "@/lib/types";
import { formatDistanceToNowStrict } from "date-fns";
import { MarkdownContent } from "./MarkdownContent";
import { CopyIcon } from "@phosphor-icons/react";
import MessageThought from "./MessageThought";
import { useMedia } from "@/hooks/use-media";
import { Button } from "../ui/button";
import { TYPE } from "@/lib/enums";
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

const styling = (trigger: string, messageColors?: string) => {
    switch (trigger) {
        case "SYSTEM":
            return "pr-4 sm:pr-12 w-full rounded-tl-none text-[hsl(27,31%,25%)] dark:text-[hsl(27,31%,95%)]";
        case "CRON":
            return "";
        case "USER":
            return `px-4 mb-2! sm:w-fit w-full sm:max-w-md lg:max-w-xl rounded-tr-none ${messageColors}`;
    }
}

function renderMessage(type: TYPE, content: MessageContent) {
    switch (type) {
        case TYPE.TEXT:
            return content.message && <MarkdownContent key={content.id} content={content.message} />
        case TYPE.THOUGHT:
            return content.message && <MessageThought key={content.id} message={content.message} output={content.output} />
        case TYPE.TOOL:
        case TYPE.MEDIA:
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
        <div className={cn("w-full flex flex-col group", alignment[data.triggerType])}>
            <div className={cn("py-2 rounded-sm text-[1.025rem] space-y-2", styling(data.triggerType, agent?.colors.background))}>
                {data.contents.map(content => renderMessage(content.contentType, content))}
            </div>
            <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-colors",
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
