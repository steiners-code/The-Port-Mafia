import { MainFileType } from "../../../generated/prisma";
import { prisma } from "../../../lib/db";

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