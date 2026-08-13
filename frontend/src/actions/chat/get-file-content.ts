"use server";

import { File } from "@/lib/types/media";
import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";
import { api } from "@/lib/api";

type GetFileContentResult =
    | { success: true; message: string; data: string }
    | { success: false; message: string; data?: undefined };

export async function getFileContent(fileType: File["fileType"], agentRoute: Agent["route"]): Promise<GetFileContentResult> {
    try {
        const response = await api.get<string>(getChatUrl("/file", agentRoute), {
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