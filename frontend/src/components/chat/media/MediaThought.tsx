"use client";

import { Separator } from "@/components/ui/separator";
import { MarkdownContent } from "../MarkdownContent";
import MediaWrapper from "./MediaWrapper";
import { Annotation } from "@/lib/types";
import { Agent } from "@/data/agents";

const MediaThought = ({ agent, annotations, summary }: { agent: Agent | null, annotations?: Annotation[], summary: string }) => {
    return (
        <MediaWrapper metadata={{
            name: agent?.name || "AI-chan",
            category: "THOUGHT",
            extension: "THOUGHT",
            description: agent?.quote
        }}>
            <div className="space-y-6">
                {summary ? (
                    <MarkdownContent content={summary} />
                ) : (
                    <div className="text-left">
                        [NOTHING]: Model didn't trouble thinking for you.
                    </div>
                )}

                <Separator />

                <div className="react-markdown">
                    <pre>
                        <code className="text-[1rem]!">
                            {JSON.stringify(annotations, null, 4)}
                        </code>
                    </pre>
                </div>
            </div>
        </MediaWrapper>
    )
}

export default MediaThought
