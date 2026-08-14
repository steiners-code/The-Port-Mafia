"use client";

import MediaWrapper from "./MediaWrapper";
import { Tool } from "@/lib/types/media";
import { JsonValue } from "@/lib/types";

const getHeader = (error: boolean, message: string) => {
    if (error)
        return (
            <div className="flex items-center gap-2">
                <span className="text-destructive uppercase font-mono text-sm font-semibold">[ERROR]:</span>
                <span className="text-destructive text-sm">{message}</span>
            </div>
        )
    else
        return (
            <div className="flex items-center gap-2">
                <span className="text-green-500 uppercase font-mono text-sm font-semibold">[SUCCESS]:</span>
                <span className="text-muted-foreground text-sm">{message}</span>
            </div>
        )
}

const parseArgs = (args: JsonValue) => {
    if (typeof args === "string") {
        const trimmed = args.trim();
        return trimmed ? JSON.stringify(JSON.parse(trimmed), null, 4) : "{}";
    }

    return args ? JSON.stringify(args, null, 4) : "{}";
}

const MediaTool = ({ message, output }: { message: string, output: Tool["output"] }) => {
    const args = parseArgs(output.funcArgsAccumulate)

    return (
        <MediaWrapper metadata={{
            name: output.funcCallName,
            extension: "TOOL",
        }}>
            <div className="space-y-4 react-markdown">
                <pre>
                    <code className="text-[1rem]! whitespace-pre-wrap!">
                        args = {args}
                    </code>
                </pre>

                <div className="flex items-center gap-2">
                    <span className="text-blue-500 uppercase font-mono text-sm font-semibold">[INFO]:</span>
                    <span className="text-muted-foreground text-sm">Executing:</span>
                </div>

                <pre>
                    <code className="text-[1rem]!">
                        {output.funcCallName}(args)
                    </code>
                </pre>

                {getHeader(output.funcCallIsError, message)}

                <pre>
                    <code className="text-[1rem]! whitespace-pre-wrap!">
                        {JSON.stringify(output.funcCallResult, null, 4)}
                    </code>
                </pre>
            </div>
        </MediaWrapper>
    )
}

export default MediaTool
