export const TOOL_NAMES = [
    "read_user_file",
    "write_user_file",
    "display_user_file",
    "read_memory_file",
    "write_memory_file",
    "display_memory_file",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];