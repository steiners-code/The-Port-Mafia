"use server";

import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type UpdateQuestionnaireTaskProgressPayload = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress" | "NingenShikaku";
    answers: AnswerInput;
};

export type AnswerInput = {
    index: number;
    answer: string | null;
}[]

type UpdatePostPerformanceTaskProgressPayload = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress";
    data: PerformanceInput;
};

export type PerformanceInput = {
    postId: string,
    impressions: number,
    reactions: number,
    comments: number,
    reposts: number
}[]

type UpdateAccountSnapshotTaskProgressPayload = {
    taskId: string;
    action: "MarkComplete" | "SaveProgress";
    data: SnapshotInput
}

export type SnapshotInput = {
    date: string,
    connectionsTotal: number,
    followersTotal: number
}

export async function updateQuestionnaireTaskProgress({ taskId, action, answers }: UpdateQuestionnaireTaskProgressPayload) {
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
        console.log(error);
        return {
            success: false,
            message: "Failed to update the task. Please try again.",
        };
    }
}

export async function updatePostPerformanceTaskProgress({ taskId, action, data }: UpdatePostPerformanceTaskProgressPayload) {
    try {
        const res = await api.post(getUrl("/main/tasks/update/post-performance"), {
            taskId,
            action,
            data,
        });

        return {
            success: true,
            message: res.data?.message ?? "Task updated successfully.",
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Failed to update the task. Please try again.",
        };
    }
}

export async function updateAccountSnapshotTaskProgress({ taskId, action, data }: UpdateAccountSnapshotTaskProgressPayload) {
    try {
        const res = await api.post(getUrl("/main/tasks/update/account-snapshot"), {
            taskId,
            action,
            data,
        });

        return {
            success: true,
            message: res.data?.message ?? "Task updated successfully.",
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Failed to update the task. Please try again.",
        };
    }
}