import { executeTool, isHarnessError, isToolName } from "../tools";
import { MainLogLevel } from "../../../generated/prisma";
import { ToolContext } from "../tools/definitions";
import { MainLog } from "../../../lib/types";

const MAX_EXECUTION_ATTEMPTS = 3;
const MAX_LOG_RESULT_LENGTH = 50;
const RETRY_DELAY_MS = 500;

type ExecuteFunctionCallResult = {
    funcCallResult: string;
    funcCallIsError: boolean;
    logs: MainLog[];
};

export async function executeFunctionCall(
    funcCallName: string,
    funcArgsAccumulate: string,
    context: ToolContext
): Promise<ExecuteFunctionCallResult> {
    const logs: MainLog[] = [];

    if (!isToolName(funcCallName)) {
        const message = `[Error]: Model attempted to call unknown tool: ${funcCallName}`;
        logs.push(log("ERROR", message));
        return { funcCallResult: message, funcCallIsError: true, logs };
    }

    let args: Record<string, any>;
    try {
        args = parseToolArguments(funcArgsAccumulate);
    } catch (error) {
        const message = `[Error]: Arguments for "${funcCallName}" were not valid JSON. Retry this call with corrected arguments.`;
        logs.push(log("ERROR", message));
        return { funcCallResult: message, funcCallIsError: true, logs };
    }

    logs.push(log("INFO", `Executing tool: ${funcCallName}`));

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_EXECUTION_ATTEMPTS; attempt++) {
        try {
            const result = await executeTool(funcCallName, args, context);

            logs.push(log("SUCCESS", `Attempt: ${attempt}/${MAX_EXECUTION_ATTEMPTS} – Result: ${truncateForLog(result)}`));

            return { funcCallResult: result, funcCallIsError: false, logs };
        } catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            if (isHarnessError(error)) {
                logs.push(log("ERROR", `Rejected on attempt ${attempt}: ${errorMessage}`));
                return { funcCallResult: `[Error]: ${errorMessage}`, funcCallIsError: true, logs };
            }

            logs.push(log("ERROR", `Attempt ${attempt}/${MAX_EXECUTION_ATTEMPTS} failed for "${funcCallName}": ${errorMessage}`));

            if (attempt < MAX_EXECUTION_ATTEMPTS)
                await new Promise((res) => setTimeout(res, RETRY_DELAY_MS * attempt));
        }
    }

    const finalMessage = `[Error]: The tool "${funcCallName}" failed after ${MAX_EXECUTION_ATTEMPTS} attempts. If the problem is with your arguments, you may retry with corrected arguments — otherwise, do NOT execute this tool again and notify ${context.principalName} instead.`;
    logs.push(log("ERROR", `[Error]: The tool "${funcCallName}" failed after ${MAX_EXECUTION_ATTEMPTS} attempts.`));

    return { funcCallResult: finalMessage, funcCallIsError: true, logs };
}

/**
 * Parses accumulated tool arguments. Empty/whitespace-only input is a
 * valid no-arg call and resolves to {} — anything else that fails to
 * parse is a real, deterministic failure (retrying won't fix malformed
 * JSON), so it's kept separate from execution retry logic entirely.
 */
function parseToolArguments(raw: string): Record<string, any> {
    const trimmed = raw.trim();
    if (!trimmed) return {};
    return JSON.parse(trimmed);
}

function log(level: MainLogLevel, message: string): MainLog {
    return { level, message, createdAt: new Date() };
}

function truncateForLog(value: unknown, maxLength = MAX_LOG_RESULT_LENGTH): string {
    const serialized = JSON.stringify(value);
    if (serialized.length <= maxLength) return serialized;

    const suffix = `… [+${serialized.length - maxLength}]`;
    const sliceLength = Math.max(0, maxLength - suffix.length);
    return `${serialized.slice(0, sliceLength)}${suffix}`;
}