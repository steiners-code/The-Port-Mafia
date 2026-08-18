"use client";

import { InfoIcon, ArrowBendUpLeftIcon, CheckCircleIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useHighlightStore } from "@/hooks/use-highlight-content";
import { getMessageLogs } from "@/actions/chat/get-message-logs";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMedia } from "@/hooks/use-media";
import MediaWrapper from "./MediaWrapper";
import { Loader2 } from "lucide-react";
import { formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const styles = {
    "INFO": "text-blue-500!",
    "ERROR": "text-destructive!",
    "SUCCESS": "text-green-500!",
    "WARN": "text-yellow-400!",
    "COMPLETED": "text-green-500!",
    "FAILED": "text-destructive!",
    "PENDING": "text-yellow-400!",
}

const logIcon = (level: string) => {
    switch (level) {
        case "INFO":
            return <InfoIcon weight="duotone" size={16} color="#1951d4" />
        case "SUCCESS":
            return <CheckCircleIcon weight="duotone" size={16} color="#19d44b" />
        case "ERROR":
            return <XCircleIcon weight="duotone" size={16} color="#d41919" />
        case "WARN":
            return <WarningCircleIcon weight="duotone" size={16} color="#d1d419" />
    }
}

const MediaLogs = ({ messageId }: { messageId: string }) => {
    const { highlight } = useHighlightStore();
    const { agent } = useMedia()

    const { data, isLoading } = useQuery({
        queryKey: [messageId, "logs"],
        queryFn: async () => {
            const { success, data, message } = await getMessageLogs(messageId, agent?.route || "/main")
            if (!success) toast.error(message);
            return data;
        },
    })

    const viewInChat = (contentId: string) => {
        document.getElementById(contentId)?.scrollIntoView({ behavior: "smooth", block: "center" });
        highlight(contentId);
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center gap-1">
                <Loader2 className="size-5! animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!data) {
        return (
            <MediaWrapper metadata={{
                name: "LOGS",
                category: "LOGS",
                extension: formatDate(new Date(), "EEEE, dd MMMM yyyy")
            }}>
                <div className="w-full h-full flex items-center justify-center gap-1 text-muted-foreground">
                    No Logs. Either everything is fine or in SHAMBLES
                </div>
            </MediaWrapper>
        )
    }

    return (
        <MediaWrapper metadata={{
            name: "LOGS",
            category: "LOGS",
            extension: formatDate(data[0]?.createdAt || new Date(), "EEEE, dd MMMM yyyy")
        }}>
            <div className="space-y-8 animate-in">
                {data.map(content => (
                    <div key={content.id} className="group space-y-4">
                        <div className="flex item-center justify-between">
                            <h3 className="font-serif text-lg text-foreground font-medium!">
                                {content.contentType} - {formatDate(content.createdAt, "hh:mm:ss a")}
                            </h3>

                            <div className="flex flex-row-reverse items-center gap-1">
                                <Badge
                                    variant="ghost"
                                    className={cn("text-[0.70rem]! px-3! cursor-pointer",
                                        styles[content.status]
                                    )}
                                >
                                    {content.status}
                                </Badge>

                                <Button
                                    variant="link"
                                    className="capitalize text-muted-foreground/60! hover:text-muted-foreground! text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => viewInChat(content.id)}
                                >
                                    <ArrowBendUpLeftIcon />
                                    <span>View in chat</span>
                                </Button>
                            </div>
                        </div>

                        <Table className="w-full border-separate border! rounded-sm!">
                            <TableHeader className="font-serif font-medium! uppercase text-xs! tracking-wider">
                                <TableRow className="font-serif font-medium! uppercase text-xs! tracking-wider">
                                    <TableCell className="max-w-1/5 w-full flex-1">Level</TableCell>
                                    <TableCell className="max-w-4/5 w-full flex-1">Message</TableCell>
                                    <TableCell className="max-w-1/5 w-full flex-1">Timestamp</TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {content.logs?.map(log => (
                                    <TableRow key={log.id} className="text-foreground">
                                        <TableCell className="flex items-center gap-2">
                                            {logIcon(log.level)}
                                            <span>
                                                {log.level}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-normal">
                                            {log.message}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(log.createdAt, "HH:mm:ss:SS")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ))}
            </div>
        </MediaWrapper>
    )
}

export default MediaLogs
