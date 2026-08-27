import { MainFileType } from "../../../generated/prisma";
import { prisma } from "../../../lib/db";
import { format } from "date-fns";

export async function getDazaiContextFiles(userId: string) {
    const files = await prisma.mainFile.findMany({
        where: { userId, fileType: { in: [MainFileType.USER, MainFileType.MEMORY] } },
        select: { fileType: true, content: true },
    });

    return {
        userFile: files.find(f => f.fileType === MainFileType.USER)?.content ?? "",
        memoryFile: files.find(f => f.fileType === MainFileType.MEMORY)?.content ?? "",
    };
}

type ContextData = {
    userFile: string,
    memoryFile: string
}

export function buildContextBlock({ userFile, memoryFile }: ContextData): string {
    return [
        "## USER",
        userFile || "(empty)",
        "",
        "## MEMORY",
        memoryFile || "(empty)",
    ].join("\n");
}

export function buildCurrentTimeBlock(principalName: string, timeZone: string): string {
    const zonedString = (new Date).toLocaleString("en-US", { timeZone })
    const zonedNow = new Date(zonedString)

    return `## Current Date & Time (${principalName}'s timezone: ${timeZone})\n${format(zonedNow, "EEEE, MMMM d yyyy, h:mm a")}`;
}