import { MarkdownContent } from "./MarkdownContent"

const MessageText = ({ content }: { content: string }) => {
    return (
        <div className="text-foreground!">
            <MarkdownContent content={content} />
        </div>
    )
}

export default MessageText
