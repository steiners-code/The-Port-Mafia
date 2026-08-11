"use client";

import MediaWrapper from "./MediaWrapper";
import { Media } from "@/lib/types/media";
import MediaFile from "./MediaFile";

const fileRender = (data: Media) => {
    switch (data.category) {
        case "FILE":
            return <MediaFile userId={data.userId} fileType={data.fileType} />
    }
}

const MediaMedia = ({ data }: { data: Media }) => {
    return (
        <MediaWrapper metadata={{
            name: data.name,
            description: data.description,
            extension: data.extension,
        }}>
            {fileRender(data)}
        </MediaWrapper>
    )
}

export default MediaMedia;