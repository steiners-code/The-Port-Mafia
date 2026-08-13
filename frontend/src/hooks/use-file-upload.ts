"use client";

import { upload as imagekitUpload, ImageKitAbortError, ImageKitInvalidRequestError, ImageKitServerError, ImageKitUploadNetworkError } from "@imagekit/next";
import { getExtension, getFileCategory, isTextExtractable } from "@/lib/file-metadata";
import { getUploadAuth } from "@/actions/blob/get-upload-auth";
import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useContentStore } from "@/hooks/use-chat";
import { STATUS, TYPE } from "@/lib/enums";
import { toast } from "sonner";

const MAX_MEDIA_PER_MESSAGE = 10;

const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
if (!IMAGEKIT_PUBLIC_KEY) {
    throw new Error("Critical: ImageKit public key not available!")
}

function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Core upload pipeline shared by both entry points: the "+" button in
 * LayoutFooter and the clipboard paste handler.
 *
 * TEXT-category files (.txt, .md) are read locally via FileReader
 * and stored directly on the content item's `data` field — they never
 * touch ImageKit. Every other file (IMAGE, APPLICATION) is uploaded to
 * ImageKit and stored as a `uri`.
 *
 * Optimistic UI: each non-text file gets a PENDING content item the
 * instant it's picked, then that same item is patched to COMPLETED (or
 * FAILED) once its upload settles. Multiple files upload in parallel,
 * each independently.
 */
export function useFileUpload() {
    const { content, setContent } = useContentStore();
    const [pendingCount, setPendingCount] = useState(0);

    const authMutation = useMutation({
        mutationFn: getUploadAuth,
    });

    const patchContentItem = useCallback(
        (id: string, patch: Record<string, any>) => {
            const latest = useContentStore.getState().content;
            setContent(latest.map((item) => (
                item.id === id ? { ...item, ...patch } : item
            )));
        },
        [setContent]
    );

    const uploadSingleFile = useCallback(
        async (file: File) => {
            const id = crypto.randomUUID();
            const extension = getExtension(file.name);
            const category = getFileCategory(extension);

            /**
             * TEXT branch: read locally, no network call, resolves as
             * COMPLETED immediately.
             */
            if (isTextExtractable(extension)) {
                try {
                    const text = await readFileAsText(file);
                    setContent([...useContentStore.getState().content, {
                        id,
                        contentType: TYPE.MEDIA,
                        status: STATUS.COMPLETED,
                        createdAt: new Date(),
                        output: {
                            name: file.name,
                            description: "",
                            extension: extension.toUpperCase(),
                            category,
                            size: file.size,
                            data: text,
                        },
                        message: null,
                        logs: null,
                    }]);
                } catch (error) {
                    console.error("Text extraction failed:", error);
                    toast.error("Couldn't read file", {
                        description: `${file.name} could not be processed.`,
                    });
                }
                return;
            }

            /**
             * IMAGE / APPLICATION branch: push a PENDING placeholder first,
             * then upload to ImageKit and patch the same item once settled.
             */
            setContent([...useContentStore.getState().content, {
                id,
                contentType: TYPE.MEDIA,
                status: STATUS.PENDING,
                createdAt: new Date(),
                output: {
                    name: file.name.split('.')[0],
                    description: "",
                    extension: extension.toUpperCase(),
                    category,
                    size: file.size,
                },
                message: null,
                logs: null,
            }]);

            setPendingCount((n) => n + 1);

            try {
                const auth = await authMutation.mutateAsync();
                if (!auth.success || !auth.data) {
                    patchContentItem(id, { status: STATUS.FAILED });
                    toast.error("Upload failed", { description: auth.message });
                    return;
                }

                const { signature, expire, token } = auth.data;

                const result = await imagekitUpload({
                    signature,
                    expire: Number(expire),
                    token,
                    publicKey: IMAGEKIT_PUBLIC_KEY!,
                    file,
                    fileName: file.name,
                    folder: 'mafia',
                });

                patchContentItem(id, {
                    status: STATUS.COMPLETED,
                    output: {
                        name: file.name.split('.')[0],
                        description: "",
                        extension: extension.toUpperCase(),
                        category,
                        size: file.size,
                        uri: result?.url ?? "",
                    },
                });
            } catch (error) {
                let description = "Something went wrong uploading this file.";
                if (error instanceof ImageKitAbortError) description = "Upload was cancelled.";
                else if (error instanceof ImageKitInvalidRequestError) description = error.message;
                else if (error instanceof ImageKitUploadNetworkError) description = "Network error during upload.";
                else if (error instanceof ImageKitServerError) description = "ImageKit server error.";

                console.error("Upload error:", error);
                patchContentItem(id, { status: STATUS.FAILED });
                toast.error(`Failed to upload ${file.name}`, { description });
            } finally {
                setPendingCount((n) => Math.max(0, n - 1));
            }
        },
        [authMutation, patchContentItem, setContent]
    );

    const uploadFiles = useCallback(
        async (files: File[]) => {
            const room = MAX_MEDIA_PER_MESSAGE - content.length;

            if (room <= 0) {
                toast.error("Media limit reached!", {
                    description: "You can not add more than 10 files per message.",
                    id: "media-paste-limit",
                });
                return;
            }

            const filesToProcess = files.slice(0, room);
            if (files.length > room) {
                toast.error("Media limit reached!", {
                    description: `Only ${room} of ${files.length} files were added.`,
                    id: "media-paste-limit",
                });
            }

            await Promise.all(filesToProcess.map(uploadSingleFile));
        },
        [content.length, uploadSingleFile]
    );

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    /**
     * Handler for the "+" button in LayoutFooter. Lazily creates a hidden,
     * multi-select file input, triggers the native picker, and routes
     * whatever's selected through the same uploadFiles pipeline as paste.
     */
    const triggerFileUpload = useCallback(() => {
        if (!fileInputRef.current) {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.style.display = "none";
            input.addEventListener("change", () => {
                if (input.files && input.files.length > 0) {
                    uploadFiles(Array.from(input.files));
                }
                input.value = "";
            });
            document.body.appendChild(input);
            fileInputRef.current = input;
        }
        fileInputRef.current.click();
    }, [uploadFiles]);

    return {
        uploadFiles,
        triggerFileUpload,
        isUploading: pendingCount > 0,
    };
}