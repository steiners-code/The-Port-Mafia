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
export async function triggerDaziaForTask(userId: string, data: MainTask, principalName: string) {
    const questionList = data.content
        .map((q) => `${q.index + 1}. ${q.question}`)
        .join("\n");

    const contents: UserMessageData["contents"] = [{
        contentType: "TEXT",
        message: `I've raised a new ${data.type} task as ${data.subAgentRole} for ${data.subAgentPlatform} — something I couldn't finish on my own. Use 'updateTask' to set a level on it, and answer what you actually know before leaving the rest to ${principalName}. Once this is resolved, if anything here is worth remembering for next time a similar task comes up, write it into MEMORY.md or USER.md — whichever actually fits — so you're not starting from nothing the next time this happens.`
    }, {
        contentType: "MEDIA",
        output: {
            name: `${data.status} Task - ${data.title}`,
            category: "TEXT",
            extension: "MD",
            data: [
                `# Task - ${data.title}`,
                `**Status:** ${data.status} - **Level:** ${data.level} - **Type:** ${data.type}`,
                '---',
                `Raised by ${data.subAgent}, the ${data.subAgentRole} for ${data.subAgentPlatform}`,
                '---',
                '# Questions',
                questionList,
            ].join('\n')
        }
    }];

    await sendChatMessage(userId, contents, MainTriggerType.SYSTEM, data.subAgent);
}