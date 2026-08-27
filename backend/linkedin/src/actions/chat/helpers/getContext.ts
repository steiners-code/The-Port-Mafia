import { LinkedinFileType } from "../../../generated/prisma";
import { prisma } from "../../../lib/db";
import { format } from "date-fns";

export async function getMahaContextFiles(userId: string) {
    const files = await prisma.linkedinFile.findMany({
        where: { userId, fileType: { in: [LinkedinFileType.USER, LinkedinFileType.EXPERIENCE] } },
        select: { fileType: true, content: true },
    });

    return {
        userFile: files.find(f => f.fileType === LinkedinFileType.USER)?.content ?? "",
        experience: files.find(f => f.fileType === LinkedinFileType.EXPERIENCE)?.content ?? "",
    };
}

type ContextData = {
    userFile: string,
    experience: string
}

export function buildContextBlock({ userFile, experience }: ContextData): string {
    return [
        "## USER",
        userFile || "(empty)",
        "",
        "## EXPERIENCE",
        experience || "(empty)",
    ].join("\n");
}

export function buildCurrentTimeBlock(principalName: string, timeZone: string): string {
    const zonedString = (new Date).toLocaleString("en-US", { timeZone })
    const zonedNow = new Date(zonedString)

    return `## Current Date & Time (${principalName}'s timezone: ${timeZone})\n${format(zonedNow, "EEEE, MMMM d yyyy, h:mm a")}`;
}