"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { exchangeLinkedInCode } from "@/actions/connect-apps";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function CallbackStatus({ icon, title, description, action }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex h-full items-center justify-center">
            <Card className="w-full max-w-md py-5 px-4 space-y-4">
                <CardHeader className="items-center text-center space-y-2">
                    {icon}
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="truncate line-clamp-3 whitespace-break-spaces wrap-break-word">{description}</CardDescription>
                </CardHeader>
                {action && <CardContent className="flex justify-center">{action}</CardContent>}
            </Card>
        </div>
    );
}

function LinkedInCallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasFiredRef = useRef(false);

    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    const {
        mutate: runExchange,
        isPending: isExchanging,
        isError: hasThrown,
        data: result,
    } = useMutation({
        mutationFn: exchangeLinkedInCode,
        onSuccess: (res) => {
            if (!res.success) {
                toast.error("Couldn't connect LinkedIn", { description: res.message });
                return;
            }

            toast.success("LinkedIn connected");
            router.push(res.redirectUrl);
        },
        onError: () => {
            toast.error("Couldn't connect LinkedIn", {
                description: "An error occurred while trying to confirm the connection.",
            });
        },
    });

    useEffect(() => {
        if (hasFiredRef.current || oauthError || !code) return;
        hasFiredRef.current = true;
        runExchange(code);
    }, [code, oauthError]);

    if (oauthError) {
        return (
            <CallbackStatus
                icon={<WarningCircleIcon size={38} className="mx-auto text-destructive" />}
                title="LinkedIn declined the request"
                description={oauthErrorDescription ?? "The connection was cancelled before it started."}
                action={<Button onClick={() => router.push("/linkedin")}>Back to LinkedIn</Button>}
            />
        );
    }

    if (!code) {
        return (
            <CallbackStatus
                icon={<WarningCircleIcon size={38} className="mx-auto text-destructive" />}
                title="Missing authorization code"
                description="This link is incomplete or has already been used."
                action={<Button onClick={() => router.push("/linkedin")}>Back to LinkedIn</Button>}
            />
        );
    }

    if (hasThrown || (result && !result.success)) {
        return (
            <CallbackStatus
                icon={<WarningCircleIcon size={38} className="mx-auto text-destructive" />}
                title="Couldn't connect LinkedIn"
                description={
                    result && !result.success
                        ? result.message
                        : "An error occurred while trying to confirm the connection."
                }
                action={<Button onClick={() => router.push("/linkedin")}>Try Again</Button>}
            />
        );
    }

    return (
        <CallbackStatus
            icon={<CircleNotchIcon size={38} className="mx-auto animate-spin text-muted-foreground" />}
            title="Connecting your LinkedIn profile"
            description="Hold on — Maha's confirming the handshake."
        />
    );
}

export default function LinkedInCallbackPage() {
    return (
        <Suspense
            fallback={
                <CallbackStatus
                    icon={<CircleNotchIcon size={38} className="mx-auto animate-spin text-muted-foreground" />}
                    title="Connecting your LinkedIn profile"
                    description="Hold on — Maha's confirming the handshake."
                />
            }
        >
            <LinkedInCallbackHandler />
        </Suspense>
    );
}