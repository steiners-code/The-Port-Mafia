import MessageSystemAgentText from "./message/MessageSystemAgentText";
import MessageMedia from "./message/MessageMedia";
import { MessageContent } from "@/lib/types";
import { TYPE } from "@/lib/enums";

function renderMessage(content: MessageContent, messageColors?: string) {
    switch (content.contentType) {
        case TYPE.TEXT:
            return content.message && <MessageSystemAgentText key={content.id} id={content.id} status={content.status} content={content.message} messageColors={messageColors} />
        case TYPE.MEDIA:
            return <MessageMedia key={content.id} id={content.id} output={content.output} />
    }
}

const MessageSystemAgent = ({ contents, messageColors }: { contents: MessageContent[], messageColors?: string }) => {
    return (
        <div className="flex flex-col items-start gap-2 px-2 mb-2! w-full sm:w-fit sm:max-w-md lg:max-w-xl">
            {contents.length > 0 && contents.map(content => renderMessage(content, messageColors))}
        </div>
    )
}

export default MessageSystemAgent