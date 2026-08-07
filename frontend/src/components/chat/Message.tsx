import { MarkdownContent } from "./MarkdownContent";
import MessageThought from "./MessageThought";
import { ChatMessage, MessageContent } from "@/lib/types";
import { TYPE } from "@/lib/enums"
import { cn } from "@/lib/utils"

const alignment = {
    "SYSTEM": "justify-start",
    "CRON": "justify-center",
    "USER": "justify-end"
}

const styling = {
    "SYSTEM": "pr-4 sm:pr-12 w-full rounded-tl-none text-[hsl(27,31%,25%)] dark:text-[hsl(27,31%,95%)]",
    "CRON": "",
    "USER": "px-4 max-w-md rounded-tr-none text-[hsl(27,31%,30%)] dark:text-[hsl(27,31%,99%)] bg-[hsl(27,31%,50%)]/20 dark:bg-[hsl(27,31%,25%)]"
}

function renderMessage(type: TYPE, content: MessageContent) {
    switch (type) {
        case TYPE.TEXT:
            return content.message && <MarkdownContent key={content.id} content={content.message} />
        case TYPE.THOUGHT:
            return <MessageThought key={content.id} message={content.message!} output={content.output} />
        case TYPE.TOOL:
        case TYPE.MEDIA:
    }
}

const Message = ({ data }: { data: ChatMessage }) => {
    return (
        <div className={cn("w-full flex items-center", alignment[data.triggerType])}>
            <div className={cn("py-2 rounded-sm text-[1.025rem] space-y-2 mb-0!", styling[data.triggerType])}>
                {data.contents.map(content => renderMessage(content.contentType, content))}
            </div>
        </div>
    )
}

export default Message
