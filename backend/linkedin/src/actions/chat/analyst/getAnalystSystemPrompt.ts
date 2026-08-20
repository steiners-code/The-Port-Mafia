import { getMahaContextFiles } from "../helpers/getContext";
import { getAnalystContextData } from "./getContext";
import path from "path";

let soulContent: string | null = null;
let strategy: string | null = null;

async function loadSoul(): Promise<string> {
    if (soulContent === null) {
        soulContent = await Bun.file(
            path.join(process.cwd(), "public", "SOUL_A.md")
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

/**
 * Builds the tiered iteration-budget block injected into the system prompt
 * on every do...while pass of the ANALYST harness. The countdown is rebuilt
 * fresh each loop rather than carried in message history, so it is always
 * accurate to what actually remains.
 *
 * Tiers exist because a flat "N calls left" line does not reliably change
 * model behavior near the limit — the tone has to escalate for the model
 * to actually wrap up instead of trailing off mid-analysis.
 */
function buildIterationBudgetBlock(remaining: number, max: number): string {
    if (remaining <= 0) {
        return [
            "## Function Calls: 0 remaining",
            "You have no tool calls left. Tools are not available to you on this turn.",
            "You must return your final JSON output now, based on everything you have already gathered.",
            "Do not describe a plan to call a tool — there is no next call. Decide and answer.",
        ].join("\n");
    }

    if (remaining <= 3) {
        return [
            `## Function Calls: ${remaining} remaining (of ${max})`,
            "You are almost out. Do not start a new line of investigation you cannot finish.",
            "If what you have is enough to decide category, angle, and technique picks — stop calling tools and answer now.",
            "Use any remaining calls only to confirm something you would otherwise be guessing at.",
        ].join("\n");
    }

    if (remaining <= 8) {
        return [
            `## Function Calls: ${remaining} remaining (of ${max})`,
            "You are past the midpoint. Start converging: confirm the pattern you suspect rather than opening new comparisons.",
        ].join("\n");
    }

    return [
        `## Function Calls: ${remaining} remaining (of ${max})`,
        "You have room to investigate properly. Use tools to verify before deciding — do not guess at a number you could check.",
    ].join("\n");
}

type GetAnalystSystemPromptArgs = {
    userId: string;
    principalName: string;
    remainingCalls: number;
    maxCalls: number;
};

export async function getAnalystSystemPrompt({
    userId,
    principalName,
    remainingCalls,
    maxCalls,
}: GetAnalystSystemPromptArgs) {
    const soulBlock = (await loadSoul()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const strategyBlock = (await loadStrategy()).replaceAll("{{PRINCIPAL_NAME}}", principalName);
    const { experience } = await getMahaContextFiles(userId)

    const analystContext = await getAnalystContextData(userId);
    const iterationBudgetBlock = buildIterationBudgetBlock(remainingCalls, maxCalls);

    return [
        soulBlock,
        "---",
        strategyBlock,
        "---",
        "## EXPERIENCE",
        experience || "(empty)",
        "---",
        analystContext,
        "---",
        iterationBudgetBlock,
    ].join("\n");
}