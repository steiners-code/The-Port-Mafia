"use client";

import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { Button } from "../ui/button"
import { useSidebar } from "../ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

const LayoutHeader = () => {
    const { setOpen, open } = useSidebar();

    return (
        <header className="w-full max-h-20 min-h-20 px-4 flex items-center justify-between sticky top-0 left-0 bg-linear-to-b from-background via-70% via-background/70 to-background/0">
            <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                    setOpen(!open)
                }}
            >
                <SidebarSimpleIcon className="size-5 text-muted-foreground" />
            </Button>


            <div className="flex items-center gap-1">
                <ThemeToggle />
            </div>
        </header>
    )
}

export default LayoutHeader
