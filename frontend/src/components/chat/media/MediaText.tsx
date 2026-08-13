"use client";

import { useRef } from "react";

const MediaText = ({ content }: { content: string }) => {
    return (
        <div className="text-foreground react-markdown space-y-0">
            <p className="text-muted-foreground text-xs">
                Formatting may be inconsistent from source
            </p>

            <pre className="whitespace-pre-wrap">
                <code>
                    {content}
                </code>
            </pre>
        </div>
    )
}

export default MediaText
