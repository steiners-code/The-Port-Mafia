/**
 * Maps a file extension to the coarse category used across the content
 * pipeline. Category drives both storage behavior (extract-as-text vs
 * upload-to-ImageKit) and frontend rendering (e.g. IMAGE renders via <img>).
 *
 * Extension, not mime type, is used to derive category — mime type is
 * unreliable for text files across browsers/OS (e.g. .md can report
 * text/markdown, text/plain, or nothing at all).
 *
 * TEXT_EXTENSIONS are read locally and never uploaded to ImageKit.
 * Everything else (IMAGE, APPLICATION) goes through ImageKit.
 *
 * Category strings ("TEXT" / "IMAGE" / "APPLICATION") are placeholders —
 * swap in the real enum values once confirmed.
 */
export const TEXT_EXTENSIONS = ["txt", "md", "csv"] as const;
export const EXTRACTABLE_EXTENSIONS = ["txt", "md"] as const;

const IMAGE_EXTENSIONS = [
    "png",
    "jpeg",
    "webp",
    "heic",
    "gif",
    "bmp",
    "tiff",
    "jpg",
    "svg",
    "avif",
] as const;

const APPLICATION_EXTENSIONS = ["pdf"] as const;

export type FileCategory = "TEXT" | "IMAGE" | "APPLICATION";

export function getExtension(fileName: string): string {
    const parts = fileName.split(".");
    if (parts.length < 2) return "";
    return parts[parts.length - 1]!.toLowerCase();
}

export function getFileCategory(extension: string): FileCategory {
    const ext = extension.toLowerCase();

    if ((TEXT_EXTENSIONS as readonly string[]).includes(ext)) return "TEXT";
    if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return "IMAGE";
    if ((APPLICATION_EXTENSIONS as readonly string[]).includes(ext)) return "APPLICATION";

    /**
     * Unrecognized extensions fall back to APPLICATION (upload as-is, no
     * text extraction attempted). Flag if these need their own category
     * instead of sharing one with PDFs.
     */
    return "APPLICATION";
}

export function isTextExtractable(extension: string): boolean {
    return (EXTRACTABLE_EXTENSIONS as readonly string[]).includes(extension.toLowerCase());
}