import { useHighlightStore } from "@/hooks/use-highlight-content";
import MessageUserMedia from "./message/media/MessageUserMedia";
import MessageText from "./message/MessageText";
import { MessageContent } from "@/lib/types";
import { TYPE } from "@/lib/enums";
import { cn } from "@/lib/utils";

const MessageUser = ({ contents, messageColors }: { contents: MessageContent[], messageColors?: string }) => {
    const { highlightedId } = useHighlightStore();
    const textContent = contents.filter(c => c.contentType === TYPE.TEXT)
    const mediaContent = contents.filter(c => c.contentType === TYPE.MEDIA)

    return (
        <div className="flex flex-col items-end gap-2 px-2 mb-2! w-full sm:w-fit sm:max-w-md lg:max-w-xl">
            {mediaContent.length !== 0 && (
                <div className="relative w-full h-fit overflow-hidden">
                    {mediaContent.length > 4 && <>
                        <div className="w-5 h-full bg-linear-to-r from-background to-background/0 absolute top-0 left-0 z-50" />
                        <div className="w-5 h-full bg-linear-to-l from-background to-background/0 absolute top-0 right-0 z-50" />
                    </>}

                    <div className="w-full overflow-y-auto overflow-x-visible no-scrollbar h-fit flex flex-row-reverse items-center gap-3 flex-nowrap">
                        {mediaContent.map(content => <MessageUserMedia
                            key={content.id}
                            id={content.id}
                            output={content.output}
                            messageColors={messageColors}
                        />)}
                    </div>
                </div>
            )}

            {textContent.length !== 0 && (
                <div className={cn("py-2 px-1 rounded-sm rounded-tr-none text-[1.025rem] w-fit", messageColors)}>
                    {textContent.map(content => (
                        <div
                            key={content.id}
                            id={content.id}
                            className={cn("w-full h-fit rounded-xs px-2",
                                highlightedId === content.id && "animate-pulse-highlight",
                            )}
                        >
                            <MessageText content={content.message!} status={content.status} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MessageUser