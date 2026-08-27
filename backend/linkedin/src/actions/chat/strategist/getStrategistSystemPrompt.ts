import { buildCurrentTimeBlock, getMahaContextFiles } from "../helpers/getContext";
import path from "path";

let soulContent: string | null = null;
let strategy: string | null = null;

async function loadSoul(): Promise<string> {
    if (soulContent === null) {
        soulContent = await Bun.file(
            path.join(process.cwd(), "public", "SOUL_B.md")
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

type GetStrategistSystemPromptArgs = {
    userId: string;
    timeZone: string;
    principalName: string;
};

export async function getStrategistSystemPrompt({
    userId,
    timeZone,
    principalName,
}: GetStrategistSystemPromptArgs) {
    const soulBlock = (await loadSoul()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const strategyBlock = (await loadStrategy()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const timeBlock = buildCurrentTimeBlock(principalName, timeZone);
    const { experience } = await getMahaContextFiles(userId)

    return [
        soulBlock,
        "---",
        strategyBlock,
        "---",
        "## EXPERIENCE",
        experience || "(empty)",
        "---",
        timeBlock,
    ].join("\n");
}