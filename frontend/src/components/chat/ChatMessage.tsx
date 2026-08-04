import { MarkdownContent } from "./MarkdownContent";
import { TRIGGER, TYPE, STATUS } from "@/lib/enums"
import MessageThought from "./MessageThought";
import { cn } from "@/lib/utils"

type ChatMessageProps = {
    trigger: TRIGGER,
    contents: MessageContent[],
}

type MessageContent = {
    id: string,
    type: TYPE,
    status: STATUS,
    message?: string,
    output?: string,
    logs?: ContentLog[]
}

type ContentLog = {

}

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

const ChatMessage = ({ data }: { data: ChatMessageProps }) => {
    return (
        <div className={cn("w-full flex items-center", alignment[data.trigger])}>
            <div className={cn("py-2 rounded-sm text-[1.025rem] space-y-2 mb-0!", styling[data.trigger])}>
                {data.contents.map(content =>
                    content.type === TYPE.TEXT ? content?.message && <MarkdownContent key={content.id} content={content?.message} /> :
                        content.type === TYPE.THOUGHT && content?.message && content?.output && <MessageThought key={content.id} message={content?.message} content={content?.output} metadata={{
                            name: "Thought Process",
                            description: "Osamu Dazai's Brilliant Brain Process",
                            type: TYPE.THOUGHT,
                            extension: "THOUGHT",
                        }} />
                )}
            </div>
        </div>
    )
}

export default ChatMessage
