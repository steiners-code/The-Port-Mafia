"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import useSettings from "@/hooks/use-settings";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import connectedApps, { APPSTATUS } from "@/data/apps";
import { cn } from "@/lib/utils";

/**
 * Mock data — replace with your actual agent roster / connected-account
 * sources. Shaped this way so swapping in real data is a drop-in.
 */
const agents = [
    { id: "dazai", name: "Osamu Dazai", codename: "The Handler", platform: "Command" },
    { id: "maha", name: "Maha Balor", codename: "The Ledger", platform: "LinkedIn" },
];

export function AccountSettingsDialog({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const { theme, setTheme } = useSettings();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[60vw] h-[60vh] flex! flex-col! items-start! overflow-hidden! gap-6!">
                <DialogHeader className="h-fit">
                    <DialogTitle>Account Settings</DialogTitle>
                    <DialogDescription>Your profile, connections, agents, and preferences.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full h-full flex-1">
                    <TabsList className="w-full gap-1 px-1 bg-transparent">
                        <TabsTrigger className="border-none! data-active:bg-[#ff0000]/20! hover:bg-[#ff0000]/10! transition-colors" value="profile">Profile</TabsTrigger>
                        <TabsTrigger className="border-none! data-active:bg-[#00aaff]/20! hover:bg-[#00aaff]/10! transition-colors" value="connections">Connections</TabsTrigger>
                        <TabsTrigger className="border-none! data-active:bg-[#ffa600]/20! hover:bg-[#ffa600]/10! transition-colors" value="agents">Agents</TabsTrigger>
                        <TabsTrigger className="border-none! data-active:bg-[#00ff5e]/20! hover:bg-[#00ff5e]/10! transition-colors" value="preferences">Preferences</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 pt-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-14">
                                <AvatarImage src="/" className="object-cover aspect-square" />
                                <AvatarFallback>TC</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Ateeb Hussain</span>
                                <span className="text-xs text-muted-foreground">tandoorigamer786@gmail.com</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Edit Profile</Button>
                    </TabsContent>

                    <TabsContent value="connections" className="pt-2">
                        <div className="flex flex-col">
                            {connectedApps.map((app, index) => {
                                const Icon = app.icon;
                                const isConnected = app.status === APPSTATUS.CONNECTED;
                                const isUnavailable = app.status === APPSTATUS.UNAVAILABLE;
                                return (
                                    <div key={app.id} className="">
                                        <div className={cn(
                                            "px-4 rounded-sm group flex items-center justify-between py-2 my-2 transition-colors",
                                            app.colors.bg
                                        )}>
                                            <div className="flex items-center gap-2.5">
                                                <Icon
                                                    size={18}
                                                    weight={isConnected ? "fill" : "regular"}
                                                    className={cn("transition-colors", app.colors.logo)}
                                                />
                                                <span className={cn("text-sm", !isConnected && "text-muted-foreground", app.colors.text)}>
                                                    {app.name}
                                                </span>
                                            </div>

                                            {isConnected ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">Connected</Badge>
                                                    <Button variant="ghost" size="sm">Disconnect</Button>
                                                </div>
                                            ) : isUnavailable ? (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    Coming soon
                                                </Badge>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn("cursor-pointer", app.colors.button)}
                                                    onClick={app?.connectAction}
                                                >
                                                    Connect Now
                                                </Button>
                                            )}
                                        </div>
                                        {index < connectedApps.length - 1 && <Separator className="opacity-40!" />}
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="agents" className="pt-2">
                        <div className="flex flex-col">
                            {agents.map((agent, index) => (
                                <div key={agent.id}>
                                    <div className="flex items-center gap-3 py-2.5">
                                        <Avatar className="size-9">
                                            <AvatarFallback>
                                                {agent.name.split(" ").map((p) => p[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-1 flex-col">
                                            <span className="text-sm font-medium">{agent.name}</span>
                                            <span className="text-xs text-muted-foreground">{agent.codename}</span>
                                        </div>
                                        <Badge variant="outline">{agent.platform}</Badge>
                                    </div>
                                    {index < agents.length - 1 && <Separator />}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-select">Theme</Label>
                            <Select value={theme} onValueChange={(value) => setTheme(value ?? theme!)}>
                                <SelectTrigger id="theme-select" className="w-32 capitalize!">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="font-select">Interface Font</Label>
                            <Select defaultValue="inter">
                                <SelectTrigger id="font-select" className="w-32 capitalize!">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inter">Inter</SelectItem>
                                    <SelectItem value="system">System UI</SelectItem>
                                    <SelectItem value="mono">Monospace</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}