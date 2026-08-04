"use client";

import { DotIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { MarkdownContent } from "./MarkdownContent";
import { getAgentByPathname } from "@/data/agents";
import { usePathname } from "next/navigation";
import { useFile } from "@/hooks/use-file";
import { useSidebar } from "../ui/sidebar";
import { Button } from "../ui/button";
import { TYPE } from "@/lib/enums";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const fileRender = (type: TYPE, content: string, extension: string) => {
    switch (type) {
        case TYPE.TEXT:
            return <div className="text-foreground! p-10"><MarkdownContent content={content} /></div>
        case TYPE.THOUGHT:
            return <div className="text-foreground! p-10"><MarkdownContent content={content} /></div>
        case TYPE.TOOL:
            return <UnsupportedFileType type={type} extension={extension} />
        case TYPE.MEDIA:
            return <UnsupportedFileType type={type} extension={extension} />
        default:
            return <UnsupportedFileType type={type} extension={extension} />
    }
}

const File = () => {
    const { setOpen } = useSidebar();
    const { open, closeFile, content, metadata } = useFile();
    const pathname = usePathname();

    useEffect(() => {
        closeFile()
    }, [pathname])

    const agent = getAgentByPathname(pathname);

    return (
        <div className={cn("h-screen", open ? "max-w-1/2 w-full ml-1 border-l border-separate" : "max-w-0", agent?.colors.file)}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center">
                        <h1>{metadata?.name}</h1>
                        <DotIcon size={16} className="text-muted-foreground" />
                        <h1 className="text-sm text-muted-foreground font-light">{metadata?.extension}</h1>
                    </div>
                    <p className="text-xs text-muted-foreground leading-1">{metadata?.description}</p>
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => {
                        closeFile()
                        setOpen(true)
                    }}
                >
                    <XIcon size={18} weight="regular" />
                </Button>
            </div>

            <div className="h-[calc(100vh-56px)] overflow-auto thin-scrollbar">
                {content && metadata && fileRender(metadata.type, content, metadata?.extension)}
            </div>
        </div>
    )
}

export default File

const UnsupportedFileType = ({ type, extension }: { type: string | TYPE, extension: string }) => {
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