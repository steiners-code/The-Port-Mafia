import { LinkedinContentStatus, LinkedinContentType, LinkedinLogLevel } from "../../../generated/prisma";
import { PipelineSubAgentRole } from "../../../lib/cache";
import { getAutomatedLog } from "./automatedMessages";
import { sendEvent } from "../../../lib/send-event";
import { prisma } from "../../../lib/db";

type DisplayContinueButtonArgs = {
    messageId: string;
    role: PipelineSubAgentRole;
    reason: string;
    sequence?: number;
};

/**
 * Writes a MEDIA content row surfacing a resume/continue action to the
 * screen — called wherever a stage's harness hits a fatal error (traffic
 * spikes, transient API failures, etc.) and the run needs a manual nudge
 * to pick back up rather than silently dying. This does NOT itself
 * resume anything — it only surfaces the button; the actual resume logic
 * lives wherever the frontend's tap handler calls back into the
 * appropriate triggerXResponse for that role.
 */
export async function displayContinueButton({ messageId, role, reason, sequence = 10 }: DisplayContinueButtonArgs) {
    const data = await prisma.linkedinMessageContent.create({
        data: {
            chatMessageId: messageId,
            contentType: LinkedinContentType.MEDIA,
            status: LinkedinContentStatus.COMPLETED,
            sequence,
            output: {
                name: "LinkedinContinueButton",
                message: reason,
                actionType: "COMPONENT",
                category: "ACTION",
                role,
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