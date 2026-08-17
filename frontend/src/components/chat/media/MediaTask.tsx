import { getTaskPayload } from "@/actions/tasks/get-task-payload";
import { statusIcon } from "../message/media/MessageMediaTask";
import QuestionnaireForm from "./task/QuestionnaireForm";
import { formatDistanceToNowStrict } from "date-fns";
import { TASKLEVEL, TASKSTATUS } from "@/lib/enums";
import { getAgentByPlatform } from "@/data/agents";
import { DotIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query"
import MediaWrapper from "./MediaWrapper";
import { Loader2 } from "lucide-react";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    [TASKSTATUS.PENDING]: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:bg-zinc-500/20 dark:text-zinc-400",
    [TASKSTATUS.CANCELLED]: "bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400",
};

const renderTaskContent = (task: Task) => {
    switch (task.type) {
        case "QUESTIONNAIRE":
            return <QuestionnaireForm content={task.content} />
    }
}

const MediaTask = ({ title, taskId }: { taskId: string, title: string }) => {
    const { data, isLoading } = useQuery({
        queryKey: ["task", taskId],
        queryFn: async () => {
            const res = await getTaskPayload(taskId);
            if (!res.success) toast.error(res.message)

            return res.data;
        }
    });

    if (!data && isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center gap-1">
                <Loader2 className="size-5! animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) {
        return (
            <MediaWrapper metadata={{
                name: "TASK",
                category: "TASK",
                extension: "QUESTIONNAIRE",
            }}>
                <div className="w-full h-full flex items-center justify-center gap-1 text-muted-foreground">
                    Nothing in task. It either got completed or ghosted you.
                </div>
            </MediaWrapper>
        )
    }

    const agent = getAgentByPlatform(data.subAgentPlatform);

    return (
        <MediaWrapper metadata={{
            name: title,
            category: "TASK",
            extension: data.type,
        }}>
            <div className="space-y-8">
                <div className="space-y-1">
                    <div className="flex items-center">
                        <span className={cn("font-serif font-medium text-sm tracking-wider", agent?.colors.text)}>
                            {data.subAgent}, THE {data.subAgentRole}
                        </span>
                        <DotIcon size={24} />
                        <span className="first-letter:capitalize text-muted-foreground text-sm font-sans font-light tracking-wider">
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

                {renderTaskContent(data)}
            </div>
        </MediaWrapper>
    )
}

export default MediaTask