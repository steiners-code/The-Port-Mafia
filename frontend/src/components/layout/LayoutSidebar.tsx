"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarRail, useSidebar } from "../ui/sidebar";
import { GearIcon, TranslateIcon, QuestionIcon, BookOpenIcon, UsersFourIcon, SignOutIcon } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { AccountSettingsDialog } from "./AccountSettingsCard";
import { usePathname } from "next/navigation";
import { Separator } from "../ui/separator";
import { getRoutes } from "@/data/routes";
import { Button } from "../ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const LayoutSidebar = () => {
    const { open } = useSidebar()
    const path = usePathname();
    const routes = getRoutes();

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="min-h-10 py-4 flex items-center justify-center gap-1 overflow-hidden whitespace-nowrap border-b border-separate">
                    {open ? (
                        <>
                            <h1 className="higherjump_4c60f0c3-module__7zFtra__className">The Port</h1>
                            <h1 className="text-[1.35rem] text-[#a70707] dark:text-[#d50404] deadlytarget_233401d3-module__DMNnEa__className">Mafia</h1>
                        </>
                    ) : (
                        <Image
                            src="/favicon.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="rounded-md object-cover"
                        />
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                {routes.map((route, index) => (
                    <SidebarGroup key={index}>
                        <SidebarGroupLabel>
                            {route.groupLabel}
                        </SidebarGroupLabel>

                        <SidebarGroupContent>
                            <SidebarMenu className="gap-2!">
                                {route.children.map(child => (
                                    <SidebarMenuItem key={child.href} className={cn("flex items-center gap-2", child.colors.text)}>
                                        {open ? (
                                            <Link href={child.href} className={cn("ml-3! first:ml-2!", path === child.href && "underline")}>
                                                {child.label}
                                            </Link>
                                        ) : (
                                            <Link href={child.href} className={cn("mx-auto p-0.5! rounded-xs!", child.href === path && child.colors.background)}>
                                                <Avatar className="size-8! outline-none! border-transparent! rounded-none!">
                                                    <AvatarImage
                                                        src={child.avatar}
                                                        className="object-cover aspect-square! border-none!"
                                                    />
                                                    <AvatarFallback>
                                                        {child.label.split(' ')[0].charAt(0) + child.label.split(' ')[1].charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Link>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarRail />

            <AccountMenu open={open} />
        </Sidebar>
    )
}

export default LayoutSidebar

export function AccountMenu({ open, onLogout }: { open: boolean; onLogout?: () => void }) {
    const [settingsOpen, setOpen] = useState(false)

    const menuItems = [
        { label: "Settings", icon: GearIcon, onClick: () => { setOpen(!settingsOpen) } },
        { label: "Language", icon: TranslateIcon, onClick: () => { } },
        { label: "Help", icon: QuestionIcon, onClick: () => { } },
        { label: "Learn More", icon: BookOpenIcon, onClick: () => { } },
        { label: "Explore Talent", icon: UsersFourIcon, onClick: () => { } },
    ];

    return (
        <>
            <SidebarFooter className="mb-2">
                <SidebarMenuItem className="p-0!">
                    <Popover>
                        <PopoverTrigger className="flex w-full items-center gap-2 overflow-clip whitespace-nowrap rounded-md p-1 hover:bg-accent cursor-pointer">
                            <Avatar className="size-10!">
                                <AvatarImage src="/" className="object-cover aspect-square!" />
                                <AvatarFallback>TC</AvatarFallback>
                            </Avatar>

                            {open && (
                                <div className="w-3/4 text-left truncate">
                                    <h1 className="text-sm">Ateeb Hussain</h1>
                                    <p className="text-xs truncate text-muted-foreground">
                                        tandoorigamer786@gmail.com
                                    </p>
                                </div>
                            )}
                        </PopoverTrigger>

                        <PopoverContent side="top" align="start" className="w-64 p-2">
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <Avatar className="size-9!">
                                    <AvatarImage src="/" className="object-cover aspect-square!" />
                                    <AvatarFallback>TC</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <h1 className="text-sm font-medium">Ateeb Hussain</h1>
                                    <p className="text-xs truncate text-muted-foreground">
                                        tandoorigamer786@gmail.com
                                    </p>
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="w-full flex flex-col items-start">
                                {menuItems.map(({ label, icon: Icon, onClick }) => (
                                    <Button
                                        variant={'link'}
                                        key={label}
                                        onClick={onClick}
                                        className="w-full flex items-center justify-start gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                                    >
                                        <Icon size={16} />
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            <Separator className="my-2" />

                            <Button
                                variant={'link'}
                                onClick={onLogout}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                            >
                                <SignOutIcon size={16} />
                                Logout
                            </Button>
                        </PopoverContent>
                    </Popover>
                </SidebarMenuItem>
            </SidebarFooter>

            <AccountSettingsDialog open={settingsOpen} setOpen={setOpen} />
        </>
    );
}