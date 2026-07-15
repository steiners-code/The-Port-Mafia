"use client";

import { getAppConnections } from '@/actions/app-connections';
import { Separator } from '../ui/separator';
import { TabsContent } from '../ui/tabs';
import connectedApps from "@/data/apps";
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { APPSTATUS, APPTYPE } from '@/lib/enums';

const ConnectedAppsTabContent = () => {
    const { data: appMap, isLoading } = useQuery({
        queryFn: getAppConnections,
        queryKey: ['appConnections'],
        refetchOnWindowFocus: false,
    });

    return (
        <TabsContent value="connections" className="pt-2">
            <div className="flex flex-col">
                {connectedApps.map((app, index) => {
                    const Icon = app.icon;
                    return (
                        <div key={app.id} className="">
                            <div className={cn(
                                "px-4 rounded-sm group flex items-center justify-between py-2 my-2 transition-colors",
                                app.colors.bg
                            )}>
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        size={18}
                                        weight={app.enable ? "fill" : "regular"}
                                        className={cn("transition-colors", app.colors.logo)}
                                    />
                                    <span className={cn("text-sm transition-colors", !app.enable && "text-muted-foreground!", app.colors.text)}>
                                        {app.name}
                                    </span>
                                </div>

                                {isLoading ? (
                                    <Loader size={16} className='animate-spin size-4' />
                                ) : appMap?.[app.id as APPTYPE] === APPSTATUS.CONNECTED ? (
                                    <Badge variant="secondary" className='bg-transparent! text-green-600 dark:text-green-400'>Connected</Badge>
                                ) : app.enable && appMap?.[app.id as APPTYPE] === "DISCONNECTED" ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("cursor-pointer", app.colors.button)}
                                        onClick={app?.connectAction}
                                    >
                                        Connect Now
                                    </Button>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground border-none">
                                        Coming soon
                                    </Badge>
                                )}
                            </div>
                            {index < connectedApps.length - 1 && <Separator className="opacity-40!" />}
                        </div>
                    );
                })}
            </div>
        </TabsContent>
    )
}

export default ConnectedAppsTabContent
