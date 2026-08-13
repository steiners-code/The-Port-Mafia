"use client";

import { useEffect, useState, RefObject } from "react";

type SelectionState = {
    text: string;
    rect: DOMRect | null;
};

export function useTextSelection<T extends HTMLElement | null>(containerRef: RefObject<T>) {
    const [selection, setSelection] = useState<SelectionState>({ text: "", rect: null });

    useEffect(() => {
        function handleSelectionChange() {
            const sel = window.getSelection();
            const container = containerRef.current;

            if (!sel || sel.isCollapsed || !container || !sel.anchorNode || !container.contains(sel.anchorNode)) {
                setSelection({ text: "", rect: null });
                return;
            }

            const text = sel.toString().trim();
            if (!text) {
                setSelection({ text: "", rect: null });
                return;
            }

            const rect = sel.getRangeAt(0).getBoundingClientRect();
            setSelection({ text, rect });
        }

        document.addEventListener("selectionchange", handleSelectionChange);
        return () => document.removeEventListener("selectionchange", handleSelectionChange);
    }, [containerRef]);

    function clear() {
        window.getSelection()?.removeAllRanges();
        setSelection({ text: "", rect: null });
    }

    return { ...selection, clear };
}