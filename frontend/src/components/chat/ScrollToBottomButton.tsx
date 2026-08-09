"use client";

import { ArrowDownIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    visible: boolean;
    onClick: () => void;
};

export function ScrollToBottomButton({ visible, onClick }: Props) {
    return (
        <Button
            size="icon"
            variant="secondary"
            onClick={onClick}
            className={cn(
                "absolute bottom-36 left-1/2 -translate-x-1/2 rounded-full shadow-md transition-all duration-200 z-0 cursor-pointer",
                visible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <ArrowDownIcon weight="bold" className="size-4" />
        </Button>
    );
}