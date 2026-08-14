import { Image } from "@/lib/types/media"
import { cn } from "@/lib/utils"

const MessageUserMediaImage = ({ data, messageColors }: { data: Image, messageColors?: string }) => {
    return (
        <div className="rlative rounded-sm overflow-clip">
            <img
                width={80}
                height={80}
                src={data.uri}
                alt={data.name}
                className="w-full h-full aspect-square object-cover"
            />

            <div className="w-full bg-background absolute bottom-0 left-0 z-30 rounded-b-sm overflow-clip">
                <div className={cn("w-full", messageColors)}>
                    <div className={cn("w-full p-2 pt-1 flex flex-col items-start gap-0.5 text-sm", messageColors)}>
                        <span className="lowercase line-clamp-1 wrap-anywhere">{data.name}</span>
                        <span className="uppercase text-xs text-muted-foreground">{data.category}/{data.extension}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageUserMediaImage
