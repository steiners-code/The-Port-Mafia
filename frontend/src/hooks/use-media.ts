"use client"

import { Logs, MediaData, MediaWithoutType, Task, Thought, Tool } from "@/lib/types/media";
import { Agent, getAgentByPathname } from "@/data/agents";
import { useSidebar } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { JsonValue } from "@/lib/types";
import { create } from "zustand";

export type ContentType = "MEDIA" | "THOUGHT" | "LOGS" | "TOOL" | "TASK"

type MediaStore = {
    data: MediaData
    open: boolean
    previousSidebarOpen: boolean
    setPreviousSidebarOpen: (open: boolean) => void
    setMedia: (output: JsonValue, type: ContentType, agent?: Agent | null) => void
    closeMedia: () => void
}

function openMediaFn(output: JsonValue, type: ContentType, agent: Agent | null = null): MediaStore["data"] {
    if (output === null || typeof output !== "object" || Array.isArray(output))
        return null;

    switch (type) {
        case "THOUGHT":
            const { thoughtSummary, annotations } = output as Thought;
            return { type, thoughtSummary, annotations, agent }

        case "LOGS":
            const { messageId } = output as Logs;
            return { type, messageId }

        case "TOOL":
            const { message, output: toolOutput } = output as Tool;
            return { type, message, output: toolOutput }

        case "MEDIA":
            const mediaOutput = output as MediaWithoutType;
            return { type, ...mediaOutput }

        case "TASK":
            const taskOutput = output as Task;
            return { type, ...taskOutput }
    }
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