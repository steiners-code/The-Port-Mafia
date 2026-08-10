"use client";

import { Separator } from "@/components/ui/separator";
import { MarkdownContent } from "../MarkdownContent";
import { ThoughtMetadata } from "@/hooks/use-media";
import MediaWrapper from "./MediaWrapper";
import { Annotation } from "@/lib/types";

const MediaThought = ({ metadata, annotations, summary }: { metadata: ThoughtMetadata, annotations?: Annotation[], summary: string }) => {
    return (
        <MediaWrapper metadata={metadata}>
            <div className="space-y-6">
                {summary ? (
                    <MarkdownContent content={summary} />
                ) : (
                    <div className="text-left">
                        [NOTHING]: Model didn't trouble thinking for you.
                    </div>
                )}

                <Separator />

                {annotations && annotations.length !== 0 ? (
                    <div className="react-markdown">
                        <pre>
                            <code className="text-[1rem]!">
                                {JSON.stringify(annotations, null, 4)}
                            </code>
                        </pre>
                    </div>
                ) : (
                    <span>
                        [VOID]: Your query wasn't worth annotating something.
                    </span>
                )}
            </div>
        </MediaWrapper>
    )
}

export default MediaThought
