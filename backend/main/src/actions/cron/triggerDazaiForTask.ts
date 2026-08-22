import { UserMessageData, MainTask } from "../../lib/types";
import { sendChatMessage } from "../chat/sendChatMessage";
import { MainTriggerType } from "../../generated/prisma";

/**
 * Notifies Dazai that a subordinate has raised a task. Sent as a SYSTEM
 * trigger with `agent` set to the raising sub-agent, so the frontend can
 * style this as coming from her specifically rather than a generic
 * automated event. Wording is voiced as her addressing Dazai directly —
 * not full ghostwriting, just enough that the attribution reads true.
 */
export async function triggerDazaiForTask(userId: string, principalName: string, data: MainTask) {
    const contents: UserMessageData["contents"] = [{
        contentType: "TEXT",
        message: `I, ${data.subAgentRole}, have raised a new task — something I couldn't finish on my own. Set a level on it, and answer what you actually know before leaving the rest to ${principalName}.`
    }, {
        contentType: "MEDIA",
        output: {
            name: data.title,
            category: "TASK",
            extension: "TASK",
            id: data.id
        }
    }];

    await sendChatMessage(userId, contents, MainTriggerType.SYSTEM, data.subAgent);
}