"use client";

import { MediaData, useMedia } from "@/hooks/use-media";
import { WarningIcon } from "@phosphor-icons/react";
import { getAgentByPathname } from "@/data/agents";
import MediaThought from "./media/MediaThought";
import { usePathname } from "next/navigation";
import { useSidebar } from "../ui/sidebar";
import { useEffect, useRef } from "react";
import MediaText from "./media/MediaText";
import MediaFile from "./media/MediaFile";
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
        case "FILE":
            return <MediaFile metadata={data.metadata} id={data.id} />
        default:
            return <UnsupportedMediaType type={"data?.type!"} extension="UNDEFINED" />
    }
}

const MediaDisplay = () => {
    const { setOpen } = useSidebar();

    const { open, closeMedia, data, previousSidebarOpen } = useMedia();
    const prevOpenRef = useRef(open);
    const pathname = usePathname();

    useEffect(() => {
        if (prevOpenRef.current === open) return;

        setOpen(open ? false : previousSidebarOpen);
        prevOpenRef.current = open;
    }, [open, previousSidebarOpen, setOpen]);

    useEffect(() => {
        closeMedia()
    }, [pathname, closeMedia])

    const agent = getAgentByPathname(pathname);

    return (
        <div className={cn("h-screen", open ? "max-w-1/2 w-full ml-1 border-l border-separate bg-accent!" : "max-w-0", agent?.colors.file)}>
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