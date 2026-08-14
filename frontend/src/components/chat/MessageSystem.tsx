import { useHighlightStore } from "@/hooks/use-highlight-content";
import MessageThought from "./message/MessageThought";
import MessageMedia from "./message/MessageMedia";
import MessageTool from "./message/MessageTool";
import MessageText from "./message/MessageText";
import { MessageContent } from "@/lib/types";
import { TYPE } from "@/lib/enums";
import { cn } from "@/lib/utils";

function renderMessage(type: TYPE, content: MessageContent) {
    switch (type) {
        case TYPE.TEXT:
            return content.message && <MessageText key={content.id} content={content.message} />
        case TYPE.THOUGHT:
            return content.message && <MessageThought key={content.id} message={content.message} output={content.output} />
        case TYPE.TOOL:
            return content.message && <MessageTool key={content.id} message={content.message} status={content.status} output={content.output} />
        case TYPE.MEDIA:
            return <MessageMedia key={content.id} id={content.id} output={content.output} />
    }
}

const MessageSystem = ({ contents, textColors }: { contents: MessageContent[], textColors?: string }) => {
    const { highlightedId } = useHighlightStore();

    return (
        <div className={cn("py-2 rounded-sm text-[1.025rem] space-y-2 pr-2 sm:pr-10 w-full", textColors)}>
            {contents.map(content => (
                <div
                    key={content.id}
                    id={content.id}
                    className={cn("w-full h-fit rounded-sm! px-2",
                        content.contentType !== "MEDIA" && highlightedId === content.id && "animate-pulse-highlight",
                    )}
                >
                    {renderMessage(content.contentType, content)}
                </div>
            ))}
        </div>
    )
}

export default MessageSystem
