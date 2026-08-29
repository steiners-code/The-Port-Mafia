import { TOOL_NAMES, ToolName, ToolRole, toolNamesForRole } from "./registry";
import { ToolContext, TOOLS } from "./definitions";

/** Runtime guard — the model's function-call name is untrusted input,
 *  not a compile-time-known ToolName, so this has to be checked at
 *  runtime before you're allowed to treat it as one. Unchanged: still
 *  checks against the FULL name list, since a given execution context
 *  (see below) is what actually restricts which names are legal to call,
 *  not this guard. */
export function isToolName(name: string): name is ToolName {
    return (TOOL_NAMES as readonly string[]).includes(name);
}

/**
 * Restricts a function-call name to what's actually legal for the
 * currently-running agent role. isToolName only proves the string is A
 * tool; this proves it's a tool THIS caller is allowed to invoke. Keep
 * both checks — a WRITER-stage harness must reject an ANALYST-only tool
 * name even if the model hallucinates a call to it, same reasoning as
 * never trusting the model to self-route between pipeline stages.
 */
export function isToolAllowedForRole(name: ToolName, role: ToolRole): boolean {
    return toolNamesForRole(role).includes(name);
}

export async function executeTool(name: ToolName, args: unknown, context: ToolContext) {
    return TOOLS[name].execute(args, context);
}

/**
 * Full schema list — unchanged, still useful if something needs every
 * tool regardless of role (unlikely in practice, kept for parity).
 */
export const TOOL_SCHEMAS = TOOL_NAMES.map((name) => ({
    type: "function" as const,
    name,
    description: TOOLS[name].description,
    parameters: TOOLS[name].parameters,
}));

/**
 * What you actually pass to the SDK's `tools` param for a given agent
 * role — e.g. `getToolSchemasForRole("ANALYST")` inside SOUL_A's harness,
 * `getToolSchemasForRole("CHAT")` inside Maha's existing chat harness.
 * Same generation mechanism as TOOL_SCHEMAS: a new tool tagged for a role
 * appears here automatically once its registry + definitions entries
 * exist, zero extra wiring per role.
 */
export function getToolSchemasForRole(role: ToolRole) {
    return toolNamesForRole(role).map((name) => ({
        type: "function" as const,
        name,
        description: TOOLS[name].description,
        parameters: TOOLS[name].parameters,
    }));
}

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