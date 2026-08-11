"use server";

import { File } from "@/lib/types/media";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type GetFileContentResult =
    | { success: true; message: string; data: string }
    | { success: false; message: string; data?: undefined };

export async function getFileContent(fileType: File["fileType"]): Promise<GetFileContentResult> {
    try {
        const response = await api.get<string>(getUrl("/main/chat/file"), {
            params: { fileType },
        });

        return {
            success: true,
            message: "File content retrieved successfully.",
            data: response.data,
        };
    } catch (error) {
        console.error("[getFileContent]", error);

        return {
            success: false,
            message: "Couldn't retrieve the file. Please try again.",
        };
    }
}