"use server";

import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

interface UploadAuthData {
    signature: string;
    expire: string;
    token: string;
}

interface UploadAuthResult {
    success: boolean;
    message: string;
    data?: UploadAuthData;
}

/**
 * Requests short-lived ImageKit upload credentials from the backend.
 * GET /blob/auth-upload rejects if the caller isn't signed in — that
 * failure is normalized here rather than thrown, so the upload hook can
 * branch on `success` directly instead of catching a raw error.
 */
export async function getUploadAuth(): Promise<UploadAuthResult> {
    try {
        const res = await api.get<UploadAuthData>(getUrl("/main/blob/upload-auth"));

        return {
            success: true,
            message: "Upload credentials retrieved.",
            data: res.data,
        };
    } catch (error) {
        console.error("getUploadAuth error:", error);
        return {
            success: false,
            message: "You need to be signed in to upload files.",
        };
    }
}