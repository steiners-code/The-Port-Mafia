import { Text } from "@/lib/types/media"

const MessageUserMediaText = ({ data }: { data: Text }) => {
    return (
        <div className="w-full h-full p-2 flex flex-col items-start gap-2 justify-between">
            <p className="flex-1 h-full text-[0.35rem]! text-muted-foreground! whitespace-normal line-clamp-7">
                {data.data}
            </p>

            <div className="flex flex-col items-start gap-0.5 text-sm">
                <span className="lowercase line-clamp-1 wrap-anywhere">{data.name}</span>
                <span className="uppercase text-xs text-muted-foreground">{data.category}/{data.extension}</span>
            </div>
        </div>
    )
}

export default MessageUserMediaText