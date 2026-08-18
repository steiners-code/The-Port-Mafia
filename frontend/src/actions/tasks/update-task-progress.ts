"use server";

import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type UpdateTaskProgressPayload = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress" | "NingenShikaku";
    answers: { index: number; answer: string | null }[];
};

export async function updateTaskProgress({ taskId, action, answers }: UpdateTaskProgressPayload) {
    try {
        const res = await api.post(getUrl("/main/tasks/update/questionnaire"), {
            taskId,
            action,
            answers,
        });

        return {
            success: true,
            message: res.data?.message ?? "Task updated successfully.",
        };
    } catch (error) {
        return {
            success: false,
            message: "Failed to update the task. Please try again.",
        };
    }
}