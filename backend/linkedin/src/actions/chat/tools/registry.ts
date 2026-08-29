/**
 * Single source of truth for every tool that exists across the whole
 * system — Maha's chat tools AND every pipeline stage's tools (ANALYST,
 * STRATEGIST, WRITER, etc). One flat list, not one list per agent.
 *
 * Why one list instead of separate registries per stage: `ToolName`,
 * `isToolName`, and `executeTool` all need to work identically no matter
 * which agent is calling — a runtime function-call name from Gemini is
 * just a string either way, and the dispatch logic (validate → execute)
 * doesn't change based on who's asking. Splitting into multiple
 * registries would mean either duplicating that dispatch logic per
 * registry, or having executeTool take a "which registry" argument
 * everywhere it's called — both worse than tagging once here.
 */
export const TOOL_NAMES = [
    "read_user_file",
    "write_user_file",
    "display_user_file",
    "read_experience_file",
    "write_experience_file",
    "display_experience_file",
    "display_linkedin_connect_button",

    // ANALYST (SOUL_A) tools
    "fetch_technique_performance",
    "fetch_post",
    "fetch_top_performers",
    "fetch_bottom_performers",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

/**
 * Which agent role(s) a tool is available to. A tool can belong to more
 * than one role (e.g. a fetch-post tool might be useful to both ANALYST
 * and a future STRATEGIST stage) — hence an array, not a single tag.
 *
 * "CHAT" covers Maha's normal conversational tools (the USER.md/
 * EXPERIENCE.md file tools, connect-button) — kept as its own tag
 * rather than folding it into one of the pipeline subAgentRoles, since
 * chat isn't a pipeline stage.
 */
export const TOOL_ROLES = ["CHAT", "OBSERVER", "ANALYST", "STRATEGIST", "WRITER", "HANDLER"] as const;
export type ToolRole = (typeof TOOL_ROLES)[number];

/**
 * Mapped type over ToolName, same enforcement mechanism as before: add a
 * name to TOOL_NAMES and this fails to compile until an entry exists
 * here. One entry per tool, regardless of how many roles use it.
 */
export const TOOL_ROLE_MAP: Record<ToolName, ToolRole[]> = {
    read_user_file: ["CHAT"],
    write_user_file: ["CHAT"],
    display_user_file: ["CHAT"],
    read_experience_file: ["CHAT"],
    write_experience_file: ["CHAT"],
    display_experience_file: ["CHAT"],
    display_linkedin_connect_button: ["CHAT"],

    fetch_technique_performance: ["ANALYST"],
    fetch_post: ["ANALYST"],
    fetch_top_performers: ["ANALYST"],
    fetch_bottom_performers: ["ANALYST"],
};

export function toolNamesForRole(role: ToolRole): ToolName[] {
    return TOOL_NAMES.filter((name) => TOOL_ROLE_MAP[name].includes(role));
}