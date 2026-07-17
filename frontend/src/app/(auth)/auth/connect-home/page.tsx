"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserCircleIcon, CookieIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { authorizeConnection } from "@/actions/authorize-with-home";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const permissions = [
    {
        id: "profile",
        icon: UserCircleIcon,
        label: "Profile data",
        description: "Your name, avatar, and account details from Home.",
    },
    {
        id: "cookies",
        icon: CookieIcon,
        label: "Cookie information",
        description: "Session data Home uses to keep you signed in.",
    },
];

export default function ConnectHomePage() {
    const router = useRouter();

    const { mutate: authorizeMutation, isPending: isAuthorizing } = useMutation({
        mutationFn: authorizeConnection,
        onSuccess: (res) => {
            if (!res.success) {
                toast.error("Authorization failed", {
                    description: res.message,
                });
                return;
            }

            // router.push(res.redirectUrl);
        },
        onError: () => {
            toast.error("Couldn't authorize The Port Mafia", {
                description: "An error occurred while trying to authorize the connection.",
            });
        },
    });


    return (
        <div className="flex h-full items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <div className="mb-2 flex items-center gap-3">
                        <Avatar className="size-12">
                            <AvatarFallback>PM</AvatarFallback>
                        </Avatar>
                        <ArrowsLeftRightIcon size={16} className="text-muted-foreground" />
                        <Avatar className="size-12">
                            <AvatarFallback>H</AvatarFallback>
                        </Avatar>
                    </div>
                    <CardTitle>Authorize &quot;The Port Mafia&quot;</CardTitle>
                    <CardDescription>
                        &quot;The Port Mafia&quot; wants to connect to your &quot;Home&quot; account.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">This will allow The Port Mafia to:</p>
                    <div className="flex flex-col">
                        {permissions.map((permission, index) => {
                            const Icon = permission.icon;
                            return (
                                <div key={permission.id}>
                                    <div className="flex items-start gap-3 py-2.5">
                                        <Icon size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{permission.label}</span>
                                            <span className="text-xs text-muted-foreground">{permission.description}</span>
                                        </div>
                                    </div>
                                    {index < permissions.length - 1 && <Separator />}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    <div className="flex w-full gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.back()}
                            disabled={isAuthorizing}
                        >
                            Cancel
                        </Button>
                        <Button className="flex-1" onClick={() => authorizeMutation()} disabled={isAuthorizing}>
                            {isAuthorizing ? "Authorizing..." : "Authorize"}
                        </Button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                        You can revoke this access anytime from Settings.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}