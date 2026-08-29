import { getTaskPayload } from "@/actions/tasks/get-task-payload";
import AccountSnapshotForm from "./task/AccountSnapshotForm";
import PostPerformanceForm from "./task/PostPerformanceForm";
import QuestionnaireForm from "./task/QuestionnaireForm";
import { useQuery } from "@tanstack/react-query"
import MediaWrapper from "./MediaWrapper";
import { Loader2 } from "lucide-react";
import { Task } from "@/lib/types";
import { toast } from "sonner";

const renderTaskContent = (task: Task) => {
    switch (task.type) {
        case "QUESTIONNAIRE":
            return <QuestionnaireForm taskId={task.id} data={task} status={task.status} />
        case "POST_PERFORMANCE":
            return <PostPerformanceForm taskId={task.id} data={task} status={task.status} />
        case "ACCOUNT_SNAPSHOT":
            return <AccountSnapshotForm taskId={task.id} data={task} status={task.status} />
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

    return (
        <MediaWrapper metadata={{
            name: title,
            category: "TASK",
            extension: data.type,
        }}>
            {renderTaskContent(data)}
        </MediaWrapper>
    )
}

export default MediaTask