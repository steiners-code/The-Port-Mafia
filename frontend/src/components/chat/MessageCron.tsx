import { useHighlightStore } from "@/hooks/use-highlight-content"
import MessageText from "./message/MessageText"
import { MessageContent } from "@/lib/types"
import { TYPE } from "@/lib/enums"
import { cn } from "@/lib/utils"

const MessageCron = ({ contents }: { contents: MessageContent[] }) => {
    const { highlightedId } = useHighlightStore();

    return (
        <div>
            {contents.map(content => (
                content.contentType === TYPE.TEXT && (
                    <div key={content.id} className="py-2 px-1 rounded-sm rounded-tr-none text-[1.025rem] w-fit bg-accent text-foreground">
                        <div
                            key={content.id}
                            id={content.id}
                            className={cn("w-full h-fit rounded-xs px-2",
                                highlightedId === content.id && "animate-pulse-highlight",
                            )}
                        >
                            <MessageText content={content.message!} status={content.status} />
                        </div>
                    </div>
                )
            ))}
        </div>
    )
}

export default MessageCron
