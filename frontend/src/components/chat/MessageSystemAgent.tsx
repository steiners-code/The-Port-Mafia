import MessageSystemAgentText from "./message/MessageSystemAgentText";
import { TYPE, MESSAGESTATUS } from "@/lib/enums";
import MessageMedia from "./message/MessageMedia";
import { MessageContent } from "@/lib/types";

function renderMessage(content: MessageContent, messageId: string, messageColors?: string) {
    switch (content.contentType) {
        case TYPE.TEXT:
            return content.message && <MessageSystemAgentText key={content.id} id={content.id} status={content.status} content={content.message} messageColors={messageColors} />
        case TYPE.MEDIA:
            return <MessageMedia key={content.id} id={content.id} output={content.output} messageId={messageId} />
    }
}

const MessageSystemAgent = ({ contents, messageColors, messageId, status }: { contents: MessageContent[], messageId: string, messageColors?: string, status: MESSAGESTATUS }) => {
    return (
        <div className="flex flex-col items-start gap-2 px-2 mb-2! w-full sm:w-fit sm:max-w-md lg:max-w-xl">
            {contents.length > 0 && contents.map(content => renderMessage(content, messageId, messageColors))}

            {status === MESSAGESTATUS.FAILED && <span className="italic text-destructive font-light text-xs px-2">Failed</span>}
        </div>
    )
}

export default MessageSystemAgent