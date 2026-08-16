import { readMemoryFile, writeMemoryFile, displayMemoryFile } from "./executor/memoryFile";
import { displayUserFile, readUserFile, writeUserFile } from "./executor/userFile";
import { updateTask } from "./executor/updateTask";
import { getTasks } from "./executor/tasks";
import { ToolName } from "./registry";

export type ToolContext = {
    messageId: string;
    userId: string;
    principalName: string,
};

type ToolPropertySchema =
    | { type: "string"; description?: string; enum?: string[] }
    | { type: "number" | "integer" | "boolean"; description?: string }
    | { type: "array"; description?: string; items: ToolPropertySchema }
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

    get_tasks: {
        description: "Returns open tasks raised by subordinate agents — PENDING or INPROGRESS only, never completed, discarded, or cancelled ones. Use this to review what's outstanding, answer what you can, or check status before delegating further.",
        parameters: {
            type: "object",
            properties: {
                status: {
                    type: "string", description: "Optional. Filter to a single status. Omit to return all open tasks.",
                    enum: ["PENDING", "INPROGRESS", "INREVIEW"]
                },
            },
            required: [],
        },
        execute: getTasks
    },

    update_task: {
        description: "Updates a single open task by id: assign or change its level, and/or submit changes to its content. The content shape depends on the task's type — you were given that shape when the task was raised; only submit fields that match it, using the same structure. Only include what you're actually changing, and never invent a value you don't have a real answer for — omit it instead. Never reconstruct the task's full content from scratch; submit only the delta, and let the harness merge it against what's actually stored.",
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
                content: {
                    type: "object",
                    description: "Changes to the task's content, in the same structure as the task's type. For a QUESTIONNAIRE task, this is an array of { index, answer } for whichever questions you can resolve — nothing else, and never repeat the question's own text back. Other task types will have their own shape; match whatever was given to you for this task.",
                },
            },
            required: ["id"],
        },
        execute: updateTask
    },
}