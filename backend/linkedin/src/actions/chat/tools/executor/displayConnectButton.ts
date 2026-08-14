import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel } from "../../../../generated/prisma";
import { getAutomatedLog } from "../../helpers/automatedMessages";
import { ToolContext } from "../definitions";
import { prisma } from "../../../../lib/db";

export async function displayConnectButton(args: { reason: string }, { messageId, userId }: ToolContext) {
    await prisma.linkedinMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: LinkedinContentType.MEDIA,
            status: LinkedinContentStatus.COMPLETED,
            sequence: 10,
            output: {
                name: "LinkedinConnectButton",
                message: args.reason,
                type: "COMPONENT",
                category: "ACTION",
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
        message: "The LinkedIn connect button has been surfaced to the user's screen and is now visible to them.",
        componentName: "LinkedInConnectButton",
    };
}