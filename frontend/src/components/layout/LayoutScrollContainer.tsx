"use client";

import { useScrollContainerStore } from "@/hooks/use-scroll";

const LayoutScrollContainer = ({ children }: { children: React.ReactNode }) => {
    const { setContainer } = useScrollContainerStore();

    return (
        <div ref={setContainer} className="w-full h-screen flex-1 flex flex-col items-start overflow-y-auto overflow-x-hidden thin-scrollbar bg-background">
            {children}
        </div>)
}

export default LayoutScrollContainer
