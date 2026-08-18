import { UserMessageData, MainTask } from "../../lib/types";
import { sendChatMessage } from "../chat/sendChatMessage";
import { MainTriggerType } from "../../generated/prisma";

/**
 * Ningen Shikaku: the user answered, but wants Dazai to clear out the
 * noise before it goes anywhere. This is a genuine USER-triggered turn —
 * the person explicitly acted, so it's their message, not something the
 * harness imposed on Dazai's behalf.
 */
export async function triggerDazaiNingenShikaku(userId: string, task: MainTask & { id: string }) {
    const contents: UserMessageData["contents"] = [{
        contentType: "TEXT",
        message: `I've finished answering the "${task.title}" task, but I'd like you to clean these up before they go back to ${task.subAgent} — clear out anything noisy or off-topic, keep what's actually true and useful. Use 'updateTask' with id "${task.id}" once you're done, then mark it complete.`,
    }, {
        contentType: "MEDIA",
        output: {
            name: task.title,
            category: "TASK",
            extension: "TASK",
            id: task.id
        },
    }];

    await sendChatMessage(userId, contents, MainTriggerType.USER);
}