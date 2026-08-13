import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
    return (
        <div className="react-markdown">
            <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}