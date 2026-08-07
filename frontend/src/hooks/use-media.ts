"use client"

import { Agent } from "@/data/agents";
import { Annotation, JsonValue } from "@/lib/types";
import { create } from "zustand";

export type ContentType = "TEXT" | "MEDIA" | "THOUGHT" | "LOGS" | "FILE"
export type FileMediaExtensions = "USER" | "MEMORY" | "EXPERIENCE" | "JOURNAL"

export type Metadata = ThoughtMetadata | TextMetadata

// ---------- TEXT ---------- 
export type Text = {
    type: "TEXT",
    content: string,
    metadata: TextMetadata,
}

export type TextMetadata = {
    name: string,
    description?: string,
    extension: "TXT" | "MD" | "UNK"
}

// ---------- THOUGHT ---------- 
export type Thought = {
    type: "THOUGHT",
    thoughtSummary: string,
    annotations?: Annotation[],
    metadata: ThoughtMetadata,
}

export type ThoughtMetadata = {
    name: string,
    description?: string,
    extension: "THOUGHT"
}

// ---------- FILE ---------- 
export type File = {
    type: "FILE",
    id: string,
    metadata: FileMetadata,
}

export type FileMetadata = {
    name: string,
    description?: string,
    extension: FileMediaExtensions
}

export type MediaData = Text | Thought | File | null

type MediaStore = {
    data: MediaData
    open: boolean
    previousSidebarOpen: boolean;
    openMedia: (output: JsonValue, type: ContentType, agent?: Agent | null) => void
    closeMedia: () => void
}

function openMediaFn(output: JsonValue, type: ContentType, agent: Agent | null = null): MediaStore["data"] {
    let metadata: Metadata = {
        name: "Anonymous File",
        description: "This file should not exist and its origin is unknown.",
        extension: "UNK",
    }

    if (output === null || typeof output !== "object" || Array.isArray(output))
        return null;

    switch (type) {
        case "THOUGHT":
            const { thoughtSummary, annotations } = output as Thought;
            metadata = {
                name: "Thought Chain",
                description: `${agent?.name || "AI"}'s big brain thinking...`,
                extension: "THOUGHT"
            }

            return { type, thoughtSummary, annotations, metadata }
    }

    return null;
}

export const useMedia = create<MediaStore>((set) => ({
    open: false,
    data: null,
    previousSidebarOpen: false,
    openMedia: (output, type, agent) => {
        const data = openMediaFn(output, type, agent);
        set({ open: true, data });
    },
    closeMedia: () => {
        set({ open: false, data: null })
    }
}))