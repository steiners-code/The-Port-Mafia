import { LinkedinContentStatus, LinkedinContentType, LinkedinFileType, LinkedinLogLevel } from "../../../../generated/prisma";
import { getAutomatedLog } from "../../helpers/automatedMessages";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";
import { HarnessError } from "..";

const MAX_EXPERIENCE_FILE_LENGTH = 2200;

export async function writeExperienceFile(args: { content: string }, { userId }: ToolContext) {
    if (args.content.length > MAX_EXPERIENCE_FILE_LENGTH)
        throw new HarnessError(`Content is too long (${args.content.length} characters, max ${MAX_EXPERIENCE_FILE_LENGTH}). Trim it down to the essentials — EXPERIENCE.md is your short-term memory, kept only until you decide it's no longer needed. Drop anything stale before adding something new, rather than letting it pile up.`);

    await prisma.linkedinFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: LinkedinFileType.EXPERIENCE } },
        create: {
            userId: userId,
            content: args.content,
            fileType: LinkedinFileType.EXPERIENCE
        },
        update: { content: args.content }
    })
    return {
        success: true,
        message: "EXPERIENCE.md has been updated and saved. This is your short-term memory, current as of now — no need to write again unless something changes.",
        fileName: "EXPERIENCE.md",
        contentLength: args.content.length,
    };
}

export async function readExperienceFile(args: { content: string }, { userId }: ToolContext) {
    const data = await prisma.linkedinFile.upsert({
        where: { userId_fileType: { userId: userId, fileType: LinkedinFileType.EXPERIENCE } },
        create: {
            userId: userId,
            content: "(empty)",
            fileType: LinkedinFileType.EXPERIENCE
        },
        update: { content: args.content },
        select: { content: true }
    })

    return { content: data.content };
}

export async function displayExperienceFile(args: {}, { userId, messageId, principalName }: ToolContext) {
    await prisma.linkedinMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: LinkedinContentType.MEDIA,
            status: LinkedinContentStatus.COMPLETED,
            sequence: 10,
            output: {
                userId,
                fileType: LinkedinFileType.EXPERIENCE,
                name: `The Ledger: ${principalName}`,
                description: "What's actually worked, tracked properly — not guessed at twice.",
                extension: "MD",
                category: "FILE",
            },
            logs: {
                create: {
                    level: LinkedinLogLevel.INFO,
                    message: getAutomatedLog({ event: "LOG.SUCCESS", contentType: LinkedinContentType.MEDIA })
                }
            }
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
        message: "EXPERIENCE.md has been surfaced to the user's screen and is now visible to them.",
        fileName: "EXPERIENCE.md",
    };
}