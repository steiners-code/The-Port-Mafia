import { TYPE } from "@/lib/enums";
import { create } from "zustand";

export type Metadata = {
    name: string,
    type: TYPE,
    description?: string,
    extension: string,
}

type FileStore = {
    open: boolean
    content: string | null
    metadata: Metadata | null
    openFile: (content: string, metadata: Metadata) => void
    closeFile: () => void
}

export const useFile = create<FileStore>((set) => ({
    open: false,
    content: null,
    metadata: null,
    openFile: (content, metadata) => set({ open: true, content, metadata }),
    closeFile: () => set({ open: false, content: null, metadata: null })
}))