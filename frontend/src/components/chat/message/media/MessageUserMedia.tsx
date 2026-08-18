"use client";

import MessageUserMediaDefault from "./MessageUserMediaDefault";
import { MediaWithoutType } from "@/lib/types/media";
import MessageMediaTask from "./MessageMediaTask";
import { JsonValue } from "@/lib/types";

type UserMediaProps = {
    id: string,
    output: JsonValue,
    messageColors?: string,
    showClose?: boolean,
    removeContent?: (id: string) => void
    isUploading?: boolean,
}

const MessageUserMedia = ({ id, output, messageColors, removeContent, showClose = false, isUploading = false }: UserMediaProps) => {
    const data = output as MediaWithoutType

    switch (data.category) {
        case "TASK":
            return <MessageMediaTask id={id} output={data} />
        default:
            return <MessageUserMediaDefault id={id} output={data} messageColors={messageColors} removeContent={removeContent} showClose={showClose} isUploading={isUploading} />
    }
}

export default MessageUserMedia