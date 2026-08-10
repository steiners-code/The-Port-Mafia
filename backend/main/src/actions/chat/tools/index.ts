import { TOOL_NAMES, ToolName } from "./registry";
import { ToolContext, TOOLS } from "./definitions";

/** Runtime guard — the model's function-call name is untrusted input,
 *  not a compile-time-known ToolName, so this has to be checked at
 *  runtime before you're allowed to treat it as one. */
export function isToolName(name: string): name is ToolName {
    return (TOOL_NAMES as readonly string[]).includes(name);
}

export async function executeTool(name: ToolName, args: unknown, context: ToolContext) {
    return TOOLS[name].execute(args, context);
}

/** Exactly what you pass to the Gemini SDK's `tools` param — generated
 *  from the same TOOLS object, so a new tool automatically appears
 *  here with zero extra work once its entry exists in definitions.ts. */
export const TOOL_SCHEMAS = TOOL_NAMES.map((name) => ({
    type: "function" as const,
    name,
    description: TOOLS[name].description,
    parameters: TOOLS[name].parameters,
}));

/**
 * Thrown for deterministic failures the harness itself rejects before
 * or independent of actual tool execution — validation, length limits,
 * malformed input the tool refuses to act on. These will fail the same
 * way no matter how many times they're retried, so executeFunctionCall
 * treats them as terminal on first occurrence, not retryable.
 */
export class HarnessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "HarnessError";
    }
}

export function isHarnessError(error: unknown): error is HarnessError {
    return error instanceof HarnessError;
}