import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SnapshotInput, updateAccountSnapshotTaskProgress } from "@/actions/tasks/update-task-progress";
import { CheckCircleIcon, CaretDownIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { AccountSnapshotTask, Task } from "@/lib/types";
import { useMemo, ChangeEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import MediaTaskWrapper from "./MediaTaskWrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TASKSTATUS } from "@/lib/enums";
import { toast } from "sonner";

const AccountSnapshotForm = ({ taskId, data, status }: { taskId: string, data: Task, status: TASKSTATUS }) => {
    const content = data.content as AccountSnapshotTask["content"];

    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<SnapshotInput>(content)
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isComplete = useMemo(
        () => formData.connectionsTotal !== null && formData.followersTotal !== null,
        [formData]
    );

    const disabled = useMemo(
        () => status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED || isSubmitting,
        [status, isSubmitting]
    )

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED) return;

        const value = Number(e.target.value);
        const name = e.target.name;

        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(action: "MarkComplete" | "SaveProgress") {
        if (status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED) {
            toast.error("Unable to update task!", {
                description: `The task has already been ${status.toLowerCase()}`,
                id: taskId
            });
            return;
        }

        setIsSubmitting(true);

        const res = await updateAccountSnapshotTaskProgress({ taskId, action, data: formData });

        setIsSubmitting(false);

        if (!res.success) {
            toast.error(res.message, { id: taskId });
            return;
        }

        queryClient.invalidateQueries({ queryKey: ["task", taskId] })
        toast.success(res.message, { id: taskId });
    }

    const primaryAction = isComplete ? "MarkComplete" : "SaveProgress";
    const primaryLabel = isComplete ? "Mark Complete" : "Save Progress";
    const PrimaryIcon = isComplete ? CheckCircleIcon : FloppyDiskIcon;

    return (
        <MediaTaskWrapper data={data} buttonRender={
            <div className="relative max-w-full flex-1 flex items-center justify-end gap-0!">
                <Button
                    type="submit"
                    variant="secondary"
                    disabled={isSubmitting}
                    className="rounded-sm! rounded-r-none! cursor-pointer"
                    onClick={() => handleSubmit(primaryAction)}
                >
                    <PrimaryIcon size={16} />
                    <span>{primaryLabel}</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isSubmitting}
                                className="rounded-sm! rounded-l-none! border-l! cursor-pointer px-2"
                            >
                                <CaretDownIcon size={14} />
                            </Button>
                        }
                    />

                    <DropdownMenuContent align="end" className="z-100! w-full space-y-1 rounded-sm! my-2!">
                        <DropdownMenuItem onClick={() => handleSubmit("SaveProgress")} className="rounded-sm! cursor-pointer py-2 gap-3">
                            <FloppyDiskIcon size={16} />
                            Save Progress
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem onClick={() => handleSubmit("MarkComplete")} className="rounded-sm! cursor-pointer py-2 gap-3">
                            <CheckCircleIcon size={16} />
                            Mark as Complete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        }>
            <div className="space-y-8 group/form">
                <div className="flex flex-col gap-3 items-start group/question">
                    <p className="px-2 font-serif text-[1.1rem] text-foreground group-hover/form:text-muted-foreground group-hover/question:text-foreground transition-colors">Weekly account export</p>

                    <div className="w-full flex items-center flex-wrap gap-4">
                        <div className="min-w-37.5 flex-1 flex flex-col gap-1.5">
                            <Label htmlFor="connectionsTotal" className="px-2 text-xs text-muted-foreground">Connections</Label>
                            <Input
                                id="connectionsTotal"
                                disabled={disabled}
                                className="min-w-37.5 flex-1! w-full! bg-transparent! h-fit! min-h-fit! ring-0! border-0! border-b-2! rounded-none! text-[1rem]! resize-none! text-inherit! group-hover/form:text-muted-foreground! focus:text-inherit! group-hover/question:text-inherit! border-inherit! appearance-none!"
                                name="connectionsTotal"
                                type="number"
                                min={0}
                                value={formData.connectionsTotal ?? ""}
                                onChange={handleChange}
                                placeholder="Connections"
                            />
                        </div>

                        <div className="min-w-37.5 flex-1 flex flex-col gap-1.5">
                            <Label htmlFor="followersTotal" className="px-2 text-xs text-muted-foreground">Followers</Label>
                            <Input
                                id="followersTotal"
                                disabled={disabled}
                                className="min-w-37.5 flex-1! w-full! bg-transparent! h-fit! min-h-fit! ring-0! border-0! border-b-2! rounded-none! text-[1rem]! resize-none! text-inherit! group-hover/form:text-muted-foreground! focus:text-inherit! group-hover/question:text-inherit! border-inherit! appearance-none!"
                                name="followersTotal"
                                type="number"
                                min={0}
                                value={formData.followersTotal ?? ""}
                                onChange={handleChange}
                                placeholder="Followers"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MediaTaskWrapper>
    )
}

export default AccountSnapshotForm