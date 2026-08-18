"use server";

import { getUrl } from "@/lib/utils";
import { Task } from "@/lib/types";
import { api } from "@/lib/api";

export async function getTaskPayload(id: string) {
    try {
        const res = await api.get<Task>(getUrl('/main/tasks/get'), {
            params: { id }
        })

        return {
            success: true,
            data: res.data
        }
    } catch (error) {
        console.error("[getFileContent]", error);

        return {
            success: false,
            message: "Couldn't retrieve the file. Please try again.",
        };
    }
}