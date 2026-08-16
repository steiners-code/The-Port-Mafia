import { MainTriggerType, SubAgent } from "../../generated/prisma";
import { UserMessageData, MainTask } from "../../lib/types";
import { sendChatMessage } from "../chat/sendChatMessage";

export async function triggerDazaiForTask(userId: string, principalName: string, data: MainTask) {
    const contents: UserMessageData["contents"] = [{
        contentType: "TEXT",
        message: `I've raised a new ${data.type} task as ${data.subAgentRole} for ${data.subAgentPlatform} — something I couldn't finish on my own. Use 'updateTask' to set a level on it, and answer what you actually know before leaving the rest to ${principalName}.`
    }, {
        contentType: "MEDIA",
        output: {
            name: `${data.status} Task - ${data.title}`,
            category: "TEXT",
            extension: "MD",
            data: [
                `# Task - ${data.title}`,
                `**Status:** ${data.status} - **Level:** ${data.level} - **Type:** ${data.type}`,
                `Task ID: ${data.id}`,
                '---',
                `Requested by ${data.subAgent}, the ${data.subAgentPlatform} for ${data.subAgentPlatform}`,
                '---',
                '# Content',
                JSON.stringify(data.content, null, 2),
            ].join('\n')
        }
    }]

    await sendChatMessage(userId, contents, MainTriggerType.SYSTEM, SubAgent.MAHA)
}