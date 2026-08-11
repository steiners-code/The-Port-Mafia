"use client";

import { XIcon, DotIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Metadata } from "@/lib/types/media";
import { useMedia } from "@/hooks/use-media";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const MediaWrapper = ({ children, metadata, data }: { children: ReactNode, metadata: Metadata, data?: string }) => {
    const { closeMedia } = useMedia();
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsStuck(!entry.isIntersecting),
            { threshold: 0, rootMargin: "-1px 0px 0px 0px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="h-screen relative overflow-x-hidden overflow-y-auto thin-scrollbar">
            <div ref={sentinelRef} className="h-0 opacity-0!" />
            <div className={cn("sticky top-0 left-0 z-10! w-full flex items-center justify-between gap-3 px-6 py-3 mb-6",
                "bg-background!",
                isStuck ? "shadow-none" : "shadow-none"
            )}>
                <div className="max-w-3/4 w-full flex flex-col items-start">
                    <div className="w-full flex-1 flex items-center">
                        <h1 className="uppercase font-semibold text-2xl font-serif text-foreground truncate">
                            {metadata.name}
                        </h1>
                        <DotIcon size={24} className="text-muted-foreground" />
                        <span className="text-muted-foreground font-serif text-lg">
                            {metadata.extension}
                        </span>
                    </div>
                    <p className="pl-1 text-sm leading-normal">
                        {metadata?.description}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {data && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="cursor-pointer rounded-sm!"
                            onClick={async () => await navigator.clipboard.writeText(data)}
                        >
                            Copy
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={closeMedia}
                    >
                        <XIcon />
                    </Button>
                </div>
            </div>

            <div className="h-max p-8 pt-0">
                {children}
            </div>
        </div>
    )
}

export default MediaWrapper
