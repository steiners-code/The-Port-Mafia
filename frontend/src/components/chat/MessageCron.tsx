import { TYPE } from "@/lib/enums"
import { MessageContent } from "@/lib/types"

const MessageCron = ({ contents }: { contents: MessageContent[] }) => {
    return (
        <div>
            {contents.map(content => (
                content.contentType === TYPE.TEXT && (
                    <div key={content.id} className="text-yellow-500 dark:text-yellow-200">
                        {content.message}
                    </div>
                )
            ))}
        </div>
    )
}

export default MessageCron
