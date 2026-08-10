import { readMemoryFile, writeMemoryFile, displayMemoryFile } from "./executor/memoryFile";
import { displayUserFile, readUserFile, writeUserFile } from "./executor/userFile";
import { ToolName } from "./registry";

export type ToolContext = {
    messageId: string;
    userId: string;
    principalName: string,
};

type ToolDefinition<Args = any, Result = any> = {
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, { type: string; description?: string }>;
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
};