import { MainContentType } from "../../../generated/prisma";
import { ToolName } from "../tools/registry";
import { isToolName } from "../tools";

type AutomatedMessageEvent = "MESSAGE.STARTED" | "MESSAGE.COMPLETED";
type AutomatedLogEvent = "LOG.INFO" | "LOG.SUCCESS" | "LOG.ERROR";

/**
 * Picks a random line from a pool. Kept separate from the pools
 * themselves so tuning "how random" (e.g. weighting, no-repeat-twice-
 * in-a-row) stays a one-place change later.
 */
function pick(pool: string[]): string {
    return pool[Math.floor(Math.random() * pool.length)];
}

const TEXT_STARTED = [
    "Drafting a reply. Try not to hold your breath — it's unflattering",
    "Thinking. Loudly, if you must know",
    "One moment. I'm choosing my words — a luxury you don't extend yourself",
    "Composing something. It'll be worth the wait, unlike most things",
    "Give me a second. Genius has a pace, and it isn't yours",
];

const TEXT_COMPLETED = [
    "Done. Try to act surprised",
    "Said what needed saying. You're welcome, though I wasn't fishing for it",
    "There. Painless, mostly",
    "Delivered. I'd say it cost me nothing, but that's rarely true",
    "Finished. Somewhere, a version of me is already bored of this one",
];

function thoughtDuration(startedAt: Date): string {
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000));
    if (seconds < 5) return "a breath";
    if (seconds < 20) return `${seconds} seconds`;
    if (seconds < 60) return `entirely too long — ${seconds} seconds`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}, which is embarrassing for both of us`;
}

const THOUGHT_STARTED = [
    "Thinking. Don't wait up",
    "Working something out. It's more interesting in here than it looks from out there",
    "Give me a moment to actually consider this, rather than perform considering it",
    "Turning this over. Slowly, on purpose",
];

function thoughtCompleted(startedAt: Date): string {
    const templates = [
        `Thought for ${thoughtDuration(startedAt)}. Worth every second, allegedly`,
        `Spent ${thoughtDuration(startedAt)} on that. I've spent longer avoiding less`,
        `${thoughtDuration(startedAt)}, and I've landed somewhere I actually trust`,
        `Took ${thoughtDuration(startedAt)}. Don't read into the pause — it wasn't dread, just diligence`,
    ];
    return pick(templates);
}

/**
 * MEDIA and TOOL messages are placeholders — real copy needs
 * media.metadata.category and the specific tool identity, neither of
 * which is decided yet. These exist so the harness has something
 * non-empty to write rather than blocking on undecided categories.
 */
const MEDIA_PLACEHOLDER: Record<AutomatedMessageEvent, string> = {
    "MESSAGE.STARTED": "Looking at what you sent over",
    "MESSAGE.COMPLETED": "Looked it over. Filed away",
};

const TOOL_PLACEHOLDER: Record<AutomatedMessageEvent, string> = {
    "MESSAGE.STARTED": "Reaching for a tool. Don't ask which — you'll find out if it matters",
    "MESSAGE.COMPLETED": "Tool's done its part",
};

const TEXT_LOG_INFO = [
    "Started composing. No drafts, no do-overs — I don't need them",
    "Beginning the reply. Try not to read over my shoulder",
];

const TEXT_LOG_SUCCESS = [
    "Reply written cleanly. No notes, mostly because I didn't ask for any",
    "Text finished without incident. A rare, boring kind of victory",
];

const TEXT_LOG_ERROR = [
    "Something in the reply pipeline gave out. Not my finest moment — I'll own it",
    "Failed partway through. Chalk it up to the model, not the plan",
];

const THOUGHT_LOG_INFO = [
    "Started actually thinking, rather than performing it",
    "Begun turning this over properly",
];

const THOUGHT_LOG_SUCCESS = [
    "Landed somewhere I trust. That took longer than I'd admit out loud",
    "Thought resolved cleanly. I'll allow myself a little pride, quietly",
];

const THOUGHT_LOG_ERROR = [
    "Lost the thread mid-thought. Embarrassing, but it happens even to me",
    "That line of thinking collapsed before it went anywhere useful",
];

const MEDIA_LOG_PLACEHOLDER: Record<AutomatedLogEvent, string> = {
    "LOG.INFO": "Started looking at what came in",
    "LOG.SUCCESS": "Finished going through it",
    "LOG.ERROR": "Couldn't make sense of what was sent over",
};

const TOOL_LOG_PLACEHOLDER: Record<AutomatedLogEvent, string> = {
    "LOG.INFO": "Reaching for a tool",
    "LOG.SUCCESS": "Tool call landed clean",
    "LOG.ERROR": "Tool call didn't cooperate",
};

type GetAutomatedMessageParams = {
    event: AutomatedMessageEvent;
    contentType: MainContentType;
    /** Required only for THOUGHT + MESSAGE.COMPLETED, to compute duration. */
    startedAt?: Date;
    /** Required only for TOOL messages. */
    toolName?: string;
    isError?: boolean;
};

export function getAutomatedMessage({ event, contentType, startedAt, toolName, isError }: GetAutomatedMessageParams): string {
    if (contentType === MainContentType.MEDIA) return MEDIA_PLACEHOLDER[event];

    if (contentType === MainContentType.TOOL) {
        const pool = toolName && isToolName(toolName) ? TOOL_MESSAGES[toolName] : null;

        if (event === "MESSAGE.STARTED")
            return pool ? pick(pool.started) : pick(TOOL_FALLBACK.started);

        if (!pool) return pick(TOOL_FALLBACK.completed);
        return pick(isError ? pool.completedError : pool.completedSuccess);
    }

    if (event === "MESSAGE.STARTED") {
        return contentType === MainContentType.TEXT ? pick(TEXT_STARTED) : pick(THOUGHT_STARTED);
    }

    if (contentType === MainContentType.TEXT) return pick(TEXT_COMPLETED);
    return startedAt ? thoughtCompleted(startedAt) : pick(TEXT_COMPLETED);
}

type GetAutomatedLogParams = {
    event: AutomatedLogEvent;
    contentType: MainContentType;
};

export function getAutomatedLog({ event, contentType }: GetAutomatedLogParams): string {
    switch (contentType) {
        case MainContentType.TEXT:
            if (event === "LOG.INFO") return pick(TEXT_LOG_INFO);
            if (event === "LOG.SUCCESS") return pick(TEXT_LOG_SUCCESS);
            return pick(TEXT_LOG_ERROR);

        case MainContentType.THOUGHT:
            if (event === "LOG.INFO") return pick(THOUGHT_LOG_INFO);
            if (event === "LOG.SUCCESS") return pick(THOUGHT_LOG_SUCCESS);
            return pick(THOUGHT_LOG_ERROR);

        case MainContentType.MEDIA:
            return MEDIA_LOG_PLACEHOLDER[event];

        case MainContentType.TOOL:
            return TOOL_LOG_PLACEHOLDER[event];
    }
}

type ToolMessagePool = {
    started: string[];
    completedSuccess: string[];
    completedError: string[];
};

const TOOL_MESSAGES: Record<ToolName, ToolMessagePool> = {
    read_user_file: {
        started: [
            "Pulling up what's on file about you.",
            "Checking the dossier.",
            "Reading USER.md. Try not to be too interesting.",
        ],
        completedSuccess: [
            "Read it. Nothing surprising, for once.",
            "Dossier checked.",
            "Got what I needed from your file.",
        ],
        completedError: [
            "Couldn't get into USER.md. Frustrating, but not fatal.",
            "That file didn't want to open. Noted.",
        ],
    },

    write_user_file: {
        started: [
            "Updating your file. Behave.",
            "Writing this down before I forget — or before you do.",
            "Amending the dossier.",
        ],
        completedSuccess: [
            "Filed away. USER.md updated.",
            "Written. Now it's official.",
            "Dossier's current again.",
        ],
        completedError: [
            "Couldn't write to USER.md. Whatever this was, it didn't stick.",
            "The update didn't take. I'll own that one.",
        ],
    },

    display_user_file: {
        started: [
            "Pulling your file up for you to see.",
            "Opening the dossier.",
        ],
        completedSuccess: [
            "There it is. Everything I've got on you.",
            "Dossier's open.",
        ],
        completedError: [
            "Couldn't get your file to open. Try again in a moment.",
        ],
    },

    read_memory_file: {
        started: [
            "Checking what I've actually retained.",
            "Digging through memory.",
        ],
        completedSuccess: [
            "Found what I was looking for.",
            "Memory checked out fine.",
        ],
        completedError: [
            "Couldn't get a clean read on memory. Odd.",
        ],
    },

    write_memory_file: {
        started: [
            "Committing this to memory. Properly, this time.",
            "Writing it down so I don't have to be told twice.",
        ],
        completedSuccess: [
            "Remembered. For real, this time.",
            "Memory updated.",
        ],
        completedError: [
            "That didn't make it into memory. I'll need to try again.",
        ],
    },

    display_memory_file: {
        started: [
            "Pulling up what I've kept.",
            "Opening memory for you to see.",
        ],
        completedSuccess: [
            "Here's what I've held onto.",
            "Memory's open.",
        ],
        completedError: [
            "Couldn't get memory to open cleanly.",
        ],
    },
};

const TOOL_FALLBACK: Record<"started" | "completed", string[]> = {
    started: ["Reaching for a tool. Don't ask which — you'll find out if it matters."],
    completed: ["Tool's done its part."],
};