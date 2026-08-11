import { MainContentStatus, MainContentType, MainFileType } from "../../../../generated/prisma";
import { EventType } from "../../../../lib/enums";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";
import { HarnessError } from "..";

const MAX_USER_FILE_LENGTH = 4000;

export async function writeUserFile(args: { content: string }, { userId }: ToolContext) {
    if (args.content.length > MAX_USER_FILE_LENGTH)
        throw new HarnessError(`Content is too long (${args.content.length} characters, max ${MAX_USER_FILE_LENGTH}). Trim it down to the essentials — USER.md is meant to hold durable facts and preferences, not a full transcript.`);

    await prisma.mainFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: MainFileType.USER } },
        create: {
            userId: userId,
            content: args.content,
            fileType: MainFileType.USER
        },
        update: { content: args.content }
    })

    return {
        success: true,
        message: "USER.md has been updated and saved. This change is now permanent — there's no need to write again unless something new comes up that isn't reflected here.",
        fileName: "USER.md",
        contentLength: args.content.length,
    };
}

export async function readUserFile(args: { content: string }, { userId }: ToolContext) {
    const data = await prisma.mainFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: MainFileType.USER } },
        create: {
            userId: userId,
            content: "(empty)",
            fileType: MainFileType.USER
        },
        update: { content: args.content },
        select: { content: true }
    })

    return { content: data.content };
}

export async function displayUserFile(args: {}, { userId, messageId }: ToolContext) {
    await prisma.mainMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: MainContentType.MEDIA,
            status: MainContentStatus.COMPLETED,
            sequence: 10,
            output: {
                userId,
                fileType: MainFileType.USER,
                name: "What Dazai Knows",
                description: "Everything the organization has bothered to remember about you.",
                extension: "MD",
                category: "FILE",
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
        message: "USER.md has been surfaced to the user's screen and is now visible to them.",
        fileName: "USER.md",
    };
}