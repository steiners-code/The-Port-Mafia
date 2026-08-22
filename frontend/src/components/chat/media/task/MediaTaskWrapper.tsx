import { statusIcon } from "../../message/media/MessageMediaTask";
import { formatDistanceToNowStrict } from "date-fns";
import { TASKLEVEL, TASKSTATUS } from "@/lib/enums";
import { getAgentByPlatform } from "@/data/agents";
import { DotIcon } from "lucide-react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export const levelStyles: Record<TASKLEVEL, string> = {
    [TASKLEVEL.CRITICAL]: "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
    [TASKLEVEL.HIGH]: "bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400",
    [TASKLEVEL.MEDIUM]: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
    [TASKLEVEL.EASY]: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
};

export const statusStyles: Record<TASKSTATUS, string> = {
    [TASKSTATUS.COMPLETED]: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400",
    [TASKSTATUS.INPROGRESS]: "bg-pink-500/10 text-pink-500 border-pink-500/20 dark:bg-pink-500/20 dark:text-pink-400",
    [TASKSTATUS.INREVIEW]: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400",
    [TASKSTATUS.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400",
    [TASKSTATUS.CANCELLED]: "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
};

const MediaTaskWrapper = ({ data, children, buttonRender }: { data: Task, children: React.ReactNode, buttonRender: React.ReactNode }) => {
    const agent = getAgentByPlatform(data.subAgentPlatform);

    return (
        <div className="space-y-8 h-max">
            <div className="space-y-2">
                <div className="flex flex-col items-start">
                    <span className={cn("font-serif font-medium text-sm tracking-wider", agent?.colors.text)}>
                        {data.subAgent}, THE {data.subAgentRole}
                    </span>
                    <span className="first-letter:capitalize text-muted-foreground text-xs font-sans font-light tracking-wider">
                        {data.updatedAt ? `Modified ${formatDistanceToNowStrict(data.updatedAt, { addSuffix: true })}` : `Created ${formatDistanceToNowStrict(data.createdAt, { addSuffix: true })}`}
                    </span>
                </div>

                <div className="flex items-center">
                    <span className="flex items-center gap-1">
                        {statusIcon(data?.status, 16)}
                        <span className={cn("font-semibold tracking-wide text-sm rounded-full bg-transparent!", statusStyles[data.status])}>
                            {data.status}
                        </span>
                    </span>
                    <DotIcon size={24} />
                    <span className={cn("font-semibold tracking-wide py-0.5 px-2 text-xs rounded-full", levelStyles[data.level])}>
                        {data.level}
                    </span>
                </div>
            </div>

            {children}

            {buttonRender}
        </div >
    )
}

export default MediaTaskWrapper
