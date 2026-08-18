import { ArrowsClockwiseIcon, CheckCircleIcon, ClockIcon, EyeIcon, XCircleIcon } from "@phosphor-icons/react"
import { getTaskPayload } from "@/actions/tasks/get-task-payload"
import { useHighlightStore } from "@/hooks/use-highlight-content"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useMedia } from "@/hooks/use-media"
import { Task } from "@/lib/types/media"
import { TASKSTATUS } from "@/lib/enums"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export const statusIcon = (status?: TASKSTATUS, size: number = 14) => {
    switch (status) {
        case TASKSTATUS.COMPLETED:
            return <CheckCircleIcon weight="duotone" size={size} color="#19d44b" className="flex-1 max-w-fit" />
        case TASKSTATUS.PENDING:
            return <ClockIcon weight="duotone" size={size} color="#8b8b93" className="flex-1 max-w-fit" />
        case TASKSTATUS.INREVIEW:
            return <EyeIcon weight="duotone" size={size} color="#e8a33d" className="flex-1 max-w-fit" />
        case TASKSTATUS.INPROGRESS:
            return <ArrowsClockwiseIcon weight="regular" size={size} color="#c2185b" className="flex-1 max-w-fit" /> // className="animate-spin"
        case TASKSTATUS.CANCELLED:
            return <XCircleIcon weight="duotone" size={size} color="#d41919" className="flex-1 max-w-fit" />
        default:
            return <Loader2 size={size} className="animate-spin text-muted-foreground" />
    }
}

const MessageMediaTask = ({ output, id }: { output: Task, id: string }) => {
    const { highlightedId } = useHighlightStore();
    const { openMedia } = useMedia();

    const { data } = useQuery({
        queryKey: ["task", output.id],
        queryFn: async () => {
            const res = await getTaskPayload(output.id);
            if (!res.success) toast.error(res.message)

            return res.data;
        }
    })

    return (
        <div className={cn("w-full flex items-center gap-2 px-2 rounded-sm",
            highlightedId === id && "animate-pulse-highlight",
        )}>
            {statusIcon(data?.status)}
            <Button
                variant="link"
                className="max-w-fit w-full flex-1 mx-0! p-0! hover:underline underline-offset-3! cursor-pointer font-serif! font-light! tracking-wide transition-all truncate!"
                onClick={() => openMedia(output, "TASK")}
            >
                <p className="truncate">{data?.title || output.name}</p>
            </Button>
        </div>
    )
}

export default MessageMediaTask
