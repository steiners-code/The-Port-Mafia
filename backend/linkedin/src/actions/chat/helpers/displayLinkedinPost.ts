import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel } from "../../../generated/prisma";
import { getAutomatedLog } from "./automatedMessages";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

type DisplayLinkedinPostArgs = {
    messageId: string;
    postId: string;
    sequence?: number;
};

export async function displayLinkedinPost({ messageId, postId, sequence = 10 }: DisplayLinkedinPostArgs) {
    const data = await prisma.linkedinMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: LinkedinContentType.MEDIA,
            status: LinkedinContentStatus.COMPLETED,
            sequence,
            output: {
                postId,
                name: "LinkedinPost",
                actionType: "COMPONENT",
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

    await sendEvent({ event_type: "content.created", content: { ...data, messageId, status: LinkedinContentStatus.COMPLETED } })

    return data;
}