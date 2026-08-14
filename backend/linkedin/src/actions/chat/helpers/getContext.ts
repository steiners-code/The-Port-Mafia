import { LinkedinFileType } from "../../../generated/prisma";
import { prisma } from "../../../lib/db";

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