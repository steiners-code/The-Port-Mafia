export const TOOL_NAMES = [
    "read_user_file",
    "write_user_file",
    "display_user_file",
    "read_memory_file",
    "write_memory_file",
    "display_memory_file",
    "get_all_active_tasks",
    "get_whole_task_by_id",
    "update_task",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];