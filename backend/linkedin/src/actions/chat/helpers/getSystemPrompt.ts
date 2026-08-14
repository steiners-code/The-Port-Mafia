import { buildContextBlock, getMahaContextFiles } from "./getContext";
import path from "path";

let soulContent: string | null = null;
let strategy: string | null = null;

async function loadSoul(): Promise<string> {
    if (soulContent === null) {
        soulContent = await Bun.file(
            path.join(process.cwd(), "public", "SOUL.md")
        ).text();
    }

    return soulContent;
}

async function loadStrategy(): Promise<string> {
    if (strategy === null) {
        strategy = await Bun.file(
            path.join(process.cwd(), "public", "STRATEGY.md")
        ).text();
    }

    return strategy;
}

export async function getSystemPrompt(userId: string, principalName: string, linkedinConnected: boolean) {
    const soulBlock = (await loadSoul()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const strategyBlock = (await loadStrategy()).replaceAll("{{PRINCIPAL_NAME}}", principalName);

    const mahaContext = await getMahaContextFiles(userId)
    const contextBlock = buildContextBlock(mahaContext)
    const linkedinConnection = linkedinConnected ?
        `## LinkedIn Account Status:\n${principalName}'s LinkedIn is connected and configured.` :
        `## LinkedIn Account Status:\nAccount is either not connected or the session has expired. Please have ${principalName} (once again if session expired) connect their LinkedIn account. Use show_connect_linkedin function to surface connect button to user.`

    return [
        soulBlock,
        "---",
        strategyBlock,
        "---",
        linkedinConnection,
        "---",
        contextBlock,
    ].join("\n")
}