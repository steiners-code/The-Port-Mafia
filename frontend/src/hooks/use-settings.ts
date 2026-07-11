"use client";

import { useTheme } from "next-themes";
import { useState } from "react";

export default function useSettings() {
    const [open, setOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    return {
        open,
        setOpen,
        theme,
        setTheme,
    };
};