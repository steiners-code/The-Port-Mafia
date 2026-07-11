"use client"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { MoonIcon, SunDimIcon } from "@phosphor-icons/react"

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    return (
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <SunDimIcon className="size-5 text-muted-foreground scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute size-5 text-muted-foreground scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}