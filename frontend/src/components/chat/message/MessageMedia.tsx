"use client"

import MessageMediaAction from "./media/action/MessageMediaAction";
import MessageMediaDefault from "./media/MessageMediaDefault";
import { MediaWithAction } from "@/lib/types/media";
import { JsonValue } from "@/lib/types"

const MessageMedia = ({ output, id }: { output: JsonValue, id: string }) => {
    if (typeof output !== "object" || Array.isArray(output))
        return;

    const data = output as MediaWithAction;

    switch (data.category) {
        case "ACTION":
            return <MessageMediaAction output={data} id={id} />
        default:
            return <MessageMediaDefault output={data} id={id} />
    }
}

export default MessageMedia
