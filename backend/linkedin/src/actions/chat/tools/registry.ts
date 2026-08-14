export const TOOL_NAMES = [
    "read_user_file",
    "write_user_file",
    "display_user_file",
    "read_experience_file",
    "write_experience_file",
    "display_experience_file",
    "display_linkedin_connect_button",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];