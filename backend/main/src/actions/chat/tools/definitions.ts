import { readMemoryFile, writeMemoryFile, displayMemoryFile } from "./executor/memoryFile";
import { displayUserFile, readUserFile, writeUserFile } from "./executor/userFile";
import { getTasks, getWholeTaskById } from "./executor/tasks";
import { updateTask } from "./executor/updateTask";
import { ToolName } from "./registry";

export type ToolContext = {
    messageId: string;
    userId: string;
    principalName: string,
};

type ToolPropertySchema =
    | { type: "string"; description?: string; enum?: string[] }
    | { type: "number" | "integer" | "boolean"; description?: string }
    | { type: "array"; description?: string; items?: ToolPropertySchema }
    | { type: "object"; description?: string; properties?: Record<string, ToolPropertySchema>; required?: string[] };

type ToolDefinition<Args = any, Result = any> = {
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, ToolPropertySchema>;
        required: string[];
    };
    execute: (args: Args, context: ToolContext) => Promise<Result>;
};

/**
 * Mapped type over ToolName — TypeScript requires every key in
 * ToolName to be present here, and rejects any key that isn't. Add a
 * name to TOOL_NAMES and this object literal below fails to compile
 * until you fill in its entry. That's the "linking" mechanism.
 */
type ToolMap = {
    [K in ToolName]: ToolDefinition;
};

export const TOOLS: ToolMap = {
    read_user_file: {
        description: "Reads the current contents of USER.md. Note: USER.md's full contents are already included in your system prompt — only call this if you specifically suspect the file has changed since the conversation began, not to check something you already have.",
        parameters: { type: "object", properties: {}, required: [] },
        execute: readUserFile
    },

    write_user_file: {
        description: "Overwrites USER.md with new content.",
        parameters: {
            type: "object",
            properties: { content: { type: "string", description: "Full new file content." } },
            required: ["content"],
        },
        execute: writeUserFile
    },

    display_user_file: {
        description: "Surfaces USER.md to the user's screen, opening it in their file viewer so they can see it directly. This is a real, one-time UI action — once called, the file stays visible on their screen until they close it themselves. Calling this again does not refresh, re-open, or do anything further; only call it once per file per request.",
        parameters: { type: "object", properties: {}, required: [] },
        execute: displayUserFile
    },

    read_memory_file: {
        description: "Reads the current contents of MEMORY.md. Note: MEMORY.md's full contents are already included in your system prompt — only call this if you specifically suspect the file has changed since the conversation began, not to check something you already have.",
        parameters: { type: "object", properties: {}, required: [] },
        execute: readMemoryFile
    },

    write_memory_file: {
        description: "Overwrites MEMORY.md with new content.",
        parameters: {
            type: "object",
            properties: { content: { type: "string", description: "Full new file content." } },
            required: ["content"],
        },
        execute: writeMemoryFile
    },

    display_memory_file: {
        description: "Surfaces MEMORY.md to the user's screen, opening it in their file viewer so they can see it directly. This is a real, one-time UI action — once called, the file stays visible on their screen until they close it themselves. Calling this again does not refresh, re-open, or do anything further; only call it once per file per request.",
        parameters: { type: "object", properties: {}, required: [] },
        execute: displayMemoryFile
    },

    get_all_active_tasks: {
        description: "Returns an overview of your open tasks — counts, breakdown by status/platform/agent/role — not their full content. You already got a task's full content when it was raised, in this same conversation. If you need to see a task's actual content again later, use get_whole_task_by_id with its id — do not guess or reconstruct content from this overview.",
        parameters: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    description: "Optional. Filter to a single status. Omit to return all open tasks.",
                    enum: ["PENDING", "INPROGRESS", "INREVIEW"],
                },
            },
            required: [],
        },
        execute: getTasks
    },

    get_whole_task_by_id: {
        description: "Returns one task's full content, in real detail — every question, every field. CRITICAL: only use this if you actually need a task's entire body — e.g. re-checking something after get_tasks showed you a task exists, but you no longer have its content in this conversation. DO NOT EXECUTE CARELESSLY: you already receive a task's full content once, the moment it's raised, in this same conversation — calling this again for a task you were already given content for in this session wastes a call for nothing.",
        parameters: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The task's id, exactly as given to you.",
                },
            },
            required: ["id"],
        },
        execute: getWholeTaskById
    },

    update_task: {
        description: "Updates a single open task by id: assign or change its level, and/or submit changes to its content. The content shape depends on the task's type — you were given that shape when the task was raised; only submit fields that match it, using the same structure. Only include what you're actually changing, and never invent a value you don't have a real answer for — omit it instead. Never reconstruct the task's full content from scratch; submit only the delta, and let the harness merge it against what's actually stored. CRITICAL: Calling this tool immediately and permanently updates the real task record. You do not need to verify or repeat the call for the same change",
        parameters: {
            type: "object",
            properties: {
                id: {
                    type: "string",
                    description: "The task's id, exactly as given to you.",
                },
                level: {
                    type: "string",
                    description: "Assign only if you're setting or changing the task's priority. Omit if you're only submitting content changes.",
                    enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                },
                comment: {
                    type: "string",
                    description: "Optional note attached to the task — why you couldn't complete the rest, or context worth the user seeing.",
                },
                questionnaireAnswers: {
                    type: "array",
                    description: "Only for a QUESTIONNAIRE task. One entry per question you can resolve.",
                    items: {
                        type: "object",
                        properties: {
                            index: { type: "integer", description: "The question's index, exactly as given." },
                            answer: { type: "string", description: "Your answer to this specific question." },
                        },
                        required: ["index", "answer"],
                    },
                },

                accountPerformance: {
                    type: "object",
                    description: "Only for an ACCOUNT_PERFORMANCE task. The extracted row for the target date.",
                    properties: {
                        date: { type: "string", description: "ISO date this row corresponds to." },
                        impressions: { type: "integer" },
                        engagement: { type: "integer" },
                        followers: { type: "integer" },
                    },
                    required: ["date", "impressions", "engagement", "followers"],
                },

                postPerformance: {
                    type: "object",
                    description: "Only for a POST_PERFORMANCE task. One day's delta for a specific post.",
                    properties: {
                        postId: { type: "string" },
                        day: { type: "integer", description: "Which day (1-7) of this post's tracking window." },
                        reactions: { type: "integer" },
                        comments: { type: "integer" },
                        reposts: { type: "integer" },
                        impressions: { type: "integer" },
                    },
                    required: ["postId", "day", "reactions", "comments", "reposts", "impressions"],
                },
            },
            required: ["id"],
        },
        execute: updateTask
    },
}