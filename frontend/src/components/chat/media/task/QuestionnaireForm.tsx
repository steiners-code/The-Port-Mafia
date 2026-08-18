"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircleIcon, CaretDownIcon, FloppyDiskIcon, SkullIcon } from "@phosphor-icons/react";
import { updateTaskProgress } from "@/actions/tasks/update-task-progress";
import { useMemo, ChangeEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuestionnaireTask } from "@/lib/types";
import { TASKSTATUS } from "@/lib/enums";
import { toast } from "sonner";

type AnswerInput = {
    index: number,
    answer: string | null
}[]

const QuestionnaireForm = ({ taskId, content, status }: { taskId: string, content: QuestionnaireTask["content"], status: TASKSTATUS }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<AnswerInput>(content.map(c => ({ index: c.index, answer: c.answer })))
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isComplete = useMemo(
        () => formData.every((item) => item.answer !== null && item.answer.trim().length > 0),
        [formData]
    );


    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
        if (status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED) return;

        const value = e.target.value;
        setFormData((prev) => {
            const exists = prev.some((item) => item.index === index);
            if (exists) {
                return prev.map((item) =>
                    item.index === index ? { ...item, answer: value } : item
                );
            }
            return [...prev, { index, answer: value }];
        });
    }

    async function handleSubmit(action: "MarkComplete" | "SaveProgress" | "NingenShikaku") {
        if (status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED) {
            toast.error("Unable to update task!", {
                description: `The task has already been ${status.toLowerCase()}`,
                id: taskId
            });
            return;
        }

        setIsSubmitting(true);

        const answers = formData.filter(
            (item) => item.answer !== null && item.answer.trim().length > 0
        );

        const res = await updateTaskProgress({ taskId, action, answers });

        setIsSubmitting(false);

        if (!res.success) {
            toast.error(res.message, { id: taskId });
            return;
        }

        queryClient.invalidateQueries({ queryKey: ["tasks", taskId] })
        toast.success(res.message, { id: taskId });
    }

    const primaryAction = isComplete ? "MarkComplete" : "SaveProgress";
    const primaryLabel = isComplete ? "Mark Complete" : "Save Progress";
    const PrimaryIcon = isComplete ? CheckCircleIcon : FloppyDiskIcon;

    return (
        <>
            <div className="space-y-8 group/form">
                {content.map(c => (
                    <div key={c.index} className="flex items-start group/question">
                        <span className="font-serif font-semibold">{c.index}.</span>
                        <div className="flex flex-col gap-2 items-start">
                            <p className="px-2 text-foreground group-hover/form:text-muted-foreground group-hover/question:text-foreground transition-colors">{c.question}</p>

                            <Textarea
                                disabled={status === TASKSTATUS.COMPLETED || status === TASKSTATUS.CANCELLED}
                                className="bg-transparent! h-fit! min-h-fit! ring-0! border-0! border-b-2! rounded-none! text-[1rem]! resize-none! text-inherit! group-hover/form:text-muted-foreground! focus:text-inherit! group-hover/question:text-inherit! border-inherit!"
                                value={formData.find((item) => item.index === c.index)?.answer || ""}
                                onChange={(e) => handleChange(e, c.index)}
                                placeholder="Your Answer"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative w-full flex items-center justify-end gap-0! mb-20 lg:mb-0">
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
                        <Separator />
                        <DropdownMenuItem onClick={() => handleSubmit("NingenShikaku")} className="rounded-sm! cursor-pointer py-2 gap-3">
                            <SkullIcon size={16} />
                            Ningen Shikaku
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    )
}

export default QuestionnaireForm
