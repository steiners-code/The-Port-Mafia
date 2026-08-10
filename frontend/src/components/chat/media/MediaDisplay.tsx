"use client";

import { MediaData, useMedia, useMediaSync } from "@/hooks/use-media";
import { WarningIcon } from "@phosphor-icons/react";
import MediaThought from "./MediaThought";
import MediaLogs from "./MediaLogs";
import MediaText from "./MediaText";
import MediaFile from "./MediaFile";
import MediaTool from "./MediaTool";
import { TYPE } from "@/lib/enums";
import { cn } from "@/lib/utils";

const mediaRender = (data: MediaData) => {
    if (!data) {
        return <UnsupportedMediaType type="UNDEFINED" extension="UNDEFINED" />
    }

    switch (data.type) {
        case "TEXT":
            return <MediaText metadata={data.metadata} content={data.content} />
        case "THOUGHT":
            return <MediaThought metadata={data.metadata} annotations={data.annotations} summary={data.thoughtSummary} />
        case "TOOL":
            return <MediaTool message={data.message} output={data.output} />
        case "LOGS":
            return <MediaLogs messageId={data.messageId} />
        case "FILE":
            return <MediaFile metadata={data.metadata} id={data.id} />
        default:
            return <UnsupportedMediaType type={"data?.type!"} extension="UNDEFINED" />
    }
}

const MediaDisplay = () => {
    useMediaSync();
    const { open, data, agent } = useMedia();

    return (
        <div className={cn("h-screen transition-[max-width] duration-300 ease-in-out overflow-hidden thin-scrollbar",
            open ? "max-w-1/2 w-full bg-background!" : "max-w-0", // ml-1 border-l border-separate
            agent?.colors.file
        )}>
            {open && mediaRender(data)}
        </div>
    )
}

export default MediaDisplay

const UnsupportedMediaType = ({ type, extension }: { type: string | TYPE, extension: string }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <WarningIcon size={64} weight="thin" className="text-destructive" />

            <div className="flex items-center gap-1 text-destructive">
                <h1 className="text-xl font-normal">Could not open:</h1>
                <h1 className="text-xl font-normal lowercase">{type}.{extension}</h1>
            </div>

            <p className="font-light text-muted-foreground">Reason: Unsupported File Type</p>
        </div>
    )
}