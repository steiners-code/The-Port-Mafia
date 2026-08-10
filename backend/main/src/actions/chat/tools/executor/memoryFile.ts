import { MainContentType, MainFileType } from "../../../../generated/prisma";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";
import { HarnessError } from "..";

const MAX_MEMORY_FILE_LENGTH = 3000;

export async function writeMemoryFile(args: { content: string }, { userId }: ToolContext) {
    if (args.content.length > MAX_MEMORY_FILE_LENGTH)
        throw new HarnessError(`Content is too long (${args.content.length} characters, max ${MAX_MEMORY_FILE_LENGTH}). Trim it down to the essentials — MEMORY.md is your short-term memory, kept only until you decide it's no longer needed. Drop anything stale before adding something new, rather than letting it pile up.`);

    await prisma.mainFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: MainFileType.MEMORY } },
        create: {
            userId: userId,
            content: args.content,
            fileType: MainFileType.MEMORY
        },
        update: { content: args.content }
    })
    return { success: true };
}

export async function readMemoryFile(args: { content: string }, { userId }: ToolContext) {
    const data = await prisma.mainFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: MainFileType.MEMORY } },
        create: {
            userId: userId,
            content: "(empty)",
            fileType: MainFileType.MEMORY
        },
        update: { content: args.content },
        select: { content: true }
    })

    return { content: data.content };
}

export async function displayMemoryFile(args: {}, { userId, messageId, principalName }: ToolContext) {
    await prisma.mainMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: MainContentType.MEDIA,
            sequence: 10,
            output: {
                userId,
                fileType: MainFileType.MEMORY,
                metadata: {
                    name: `Case File: ${principalName}`,
                    description: "Kept quietly. Updated when it matters.",
                    extension: "MD",
                    category: "FILE",
                },
            },
        },
        select: {
            id: true,
            contentType: true,
            sequence: true,
            message: true,
            output: true,
            status: true,
            createdAt: true,
        },
    });

    // await sendEvent({ event_type: EventType.CONTENTCREATED, message: { ...data } })

    return {
        success: true,
        message: "MEMORY.md has been surfaced to the user's screen and is now visible to them.",
        fileName: "MEMORY.md",
    };
}