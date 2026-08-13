"use client";

import { create } from "zustand";
import { useEffect, useRef, useState } from "react";

type ScrollContainerStore = {
    container: HTMLDivElement | null;
    setContainer: (el: HTMLDivElement | null) => void;
};

export const useScrollContainerStore = create<ScrollContainerStore>((set) => ({
    container: null,
    setContainer: (el) => set({ container: el }),
}));


/**
 * Distance (px) from the bottom within which the user still counts as
 * "at the bottom" — small buffer so sub-pixel scroll rounding doesn't
 * cause false negatives.
 */
const BOTTOM_THRESHOLD = 80;

export function useAutoScroll(dependency: unknown) {
    const container = useScrollContainerStore((s) => s.container);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const isNearBottomRef = useRef(isNearBottom);

    function scrollToBottom(behavior: ScrollBehavior = "smooth") {
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior });
    }

    function checkNearBottom(el: HTMLDivElement) {
        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        return distance <= BOTTOM_THRESHOLD;
    }

    useEffect(() => {
        if (!container) return;

        function handleScroll() {
            const near = checkNearBottom(container!);
            isNearBottomRef.current = near;
            setIsNearBottom(near);
        }

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [container]);

    /**
     * Auto-scrolls only if the user was already near the bottom before
     * this update — a new message streaming in shouldn't yank someone
     * back down while they're reading earlier history.
     */
    useEffect(() => {
        if (!container) return;
        if (isNearBottomRef.current) scrollToBottom("auto");
    }, [dependency, container]);

    return { isNearBottom, scrollToBottom };
}