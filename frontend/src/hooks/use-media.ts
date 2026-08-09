"use client"

import { Agent, getAgentByPathname } from "@/data/agents";
import { useSidebar } from "@/components/ui/sidebar";
import { Annotation, JsonValue } from "@/lib/types";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
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

type FileMetadata = {
    name: string,
    description?: string,
    extension: FileMediaExtensions
}

// 

type Logs = {
    type: "LOGS"
    messageId: string,
}

export type MediaData = Text | Thought | File | Logs | null

type MediaStore = {
    data: MediaData
    open: boolean
    previousSidebarOpen: boolean
    setPreviousSidebarOpen: (open: boolean) => void
    setMedia: (output: JsonValue, type: ContentType, agent?: Agent | null) => void
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

        case "LOGS":
            const { messageId } = output as Logs;
            return { type, messageId }
    }

    return null;
}

const useMediaStore = create<MediaStore>((set) => ({
    open: false,
    data: null,
    previousSidebarOpen: false,
    setPreviousSidebarOpen: (open) => set({ previousSidebarOpen: open }),
    setMedia: (output, type, agent) => set({ open: true, data: openMediaFn(output, type, agent) }),
    closeMedia: () => {
        set({ open: false, data: null })
    }
}))

export function useMedia() {
    const pathname = usePathname();
    const { open: sidebarOpen } = useSidebar();
    const { open, data, setMedia, closeMedia, setPreviousSidebarOpen } = useMediaStore();

    const agent = getAgentByPathname(pathname);

    function openMedia(output: JsonValue, type: ContentType) {
        if (sidebarOpen)
            setPreviousSidebarOpen(sidebarOpen)

        setMedia(output, type, agent);
    }

    return { open, data, openMedia, closeMedia, agent };
}

export function useMediaSync() {
    const pathname = usePathname();
    const { setOpen } = useSidebar();
    const { open, previousSidebarOpen, closeMedia } = useMediaStore();
    const prevOpenRef = useRef(open);

    useEffect(() => {
        closeMedia();
    }, [pathname, closeMedia]);

    useEffect(() => {
        if (prevOpenRef.current === open) return;
        setOpen(open ? false : previousSidebarOpen);
        prevOpenRef.current = open;
    }, [open, previousSidebarOpen, setOpen]);
}