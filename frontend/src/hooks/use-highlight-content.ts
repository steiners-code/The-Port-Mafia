"use client";

import { create } from "zustand";

type HighlightStore = {
    highlightedId: string | null;
    highlight: (id: string) => void;
};

const HIGHLIGHT_DURATION = 3200;

export const useHighlightStore = create<HighlightStore>((set) => ({
    highlightedId: null,
    highlight: (id) => {
        set({ highlightedId: id });
        setTimeout(() => {
            set((state) => (state.highlightedId === id ? { highlightedId: null } : state));
        }, HIGHLIGHT_DURATION);
    },
}));