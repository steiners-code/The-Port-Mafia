import { buildContextBlock, getDazaiContextFiles } from "./getContext";
import { Connections, getAgentRoster } from "./subAgents";
import path from "path";

let soulContent: string | null = null;

async function loadSoul(): Promise<string> {
    if (soulContent === null) {
        soulContent = await Bun.file(
            path.join(process.cwd(), "public", "SOUL.md")
        ).text();
    }

    return soulContent;
}

export async function getSystemPrompt(userId: string, principalName: string, connections: Connections) {
    const soulBlock = (await loadSoul()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const rosterBlock = await getAgentRoster(connections)

    const dazaiContext = await getDazaiContextFiles(userId)
    const contextBlock = buildContextBlock(dazaiContext)

    return [
        soulBlock,
        "---",
        rosterBlock,
        "---",
        contextBlock,
    ].join("\n")
}