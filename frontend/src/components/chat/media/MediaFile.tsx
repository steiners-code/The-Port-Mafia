"use client";

import { FileMediaExtensions, FileMetadata, useMedia } from "@/hooks/use-media";
import { DotIcon, XIcon } from "@phosphor-icons/react";
import { MarkdownContent } from "../MarkdownContent";
import { Button } from "../../ui/button";

const fileRender = (type: FileMediaExtensions, id: string) => {
    switch (type) {
        case "USER":
        case "EXPERIENCE":
        case "MEMORY":
        case "JOURNAL":
            return "TODO: Implement Fetch From Backend. ID: " + id
    }
}

const MediaFile = ({ metadata, id }: { metadata: FileMetadata, id: string }) => {
    const { closeMedia } = useMedia()
    const content = fileRender(metadata.extension, id)

    return (
        <>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center">
                        <h1>{metadata.name}</h1>
                        <DotIcon size={16} className="text-muted-foreground" />
                        <h1 className="text-sm text-muted-foreground font-light">{metadata.extension}</h1>
                    </div>
                    <p className="text-xs text-muted-foreground leading-1">{metadata.description}</p>
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={closeMedia}
                >
                    <XIcon size={18} weight="regular" />
                </Button>
            </div>

            <div className="h-[calc(100vh-56px)] overflow-auto thin-scrollbar p-10 text-foreground!">
                <MarkdownContent content={content} />
            </div>
        </>
    )
}

export default MediaFile;