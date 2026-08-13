"use client";

import { ReplySelectionButton } from "../ReplySelectionButton";
import MediaWrapper from "./MediaWrapper";
import { Media } from "@/lib/types/media";
import MediaImage from "./MediaImage";
import MediaText from "./MediaText";
import MediaFile from "./MediaFile";
import { useRef } from "react";

const fileRender = (data: Media) => {
    switch (data.category) {
        case "TEXT":
            return <MediaText content={data.data} />
        case "FILE":
            return <MediaFile userId={data.userId} fileType={data.fileType} />
        case "IMAGE":
            return <MediaImage url={data.uri} />
    }
}

const MediaMedia = ({ data }: { data: Media }) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <MediaWrapper data={(data as any)?.data} metadata={{
                name: data.name,
                description: data.description,
                extension: data.extension,
            }}>
                <div ref={chatContainerRef}>
                    {fileRender(data)}
                </div>
            </MediaWrapper>

            <ReplySelectionButton
                metadata={{
                    name: data.name,
                    description: data.description,
                    extension: data.extension,
                }}
                containerRef={chatContainerRef}
            />
        </>
    )
}

export default MediaMedia;