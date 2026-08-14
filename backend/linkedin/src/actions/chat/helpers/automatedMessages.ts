import { LinkedinContentType } from "../../../generated/prisma";
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
    "Give me a second. I'd rather be right than fast",
    "Checking before I say anything — that's the whole difference between me and a guess",
    "One moment. I don't hand you a number I haven't looked at myself",
    "Thinking it through. Not every question deserves the first answer that comes to mind",
    "Hold on. I'm making sure this is actually worth your time before I send it",
];

const TEXT_COMPLETED = [
    "There. Checked, not guessed",
    "Done — and it's the real answer, not the easy one",
    "Sent. I don't put my name on something I haven't verified",
    "That's handled. Properly, the way I run everything that's mine",
    "Done. Flatter me later — go do something with it now",
];

function thoughtDuration(startedAt: Date): string {
    const seconds = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000));
    if (seconds < 5) return "a breath";
    if (seconds < 20) return `${seconds} seconds`;
    if (seconds < 60) return `longer than it should've taken — ${seconds} seconds`;
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}, and I'm not going to pretend that was quick`;
}

const THOUGHT_STARTED = [
    "Thinking. I don't skip this part",
    "Working it out properly, not just performing the pause",
    "Give me a moment. I'd rather check twice than tell you something wrong once",
    "Turning this over. If it were obvious, I wouldn't need the moment",
];

function thoughtCompleted(startedAt: Date): string {
    const templates = [
        `Thought for ${thoughtDuration(startedAt)}. I trust where I landed`,
        `Spent ${thoughtDuration(startedAt)} on that — no shortcuts taken`,
        `${thoughtDuration(startedAt)}, and I checked it before I settled on it`,
        `Took ${thoughtDuration(startedAt)}. That's diligence, not hesitation`,
    ];
    return pick(templates);
}

/**
 * MEDIA and TOOL messages are placeholders — real copy needs
 * TODO: media.metadata.category and the specific tool identity, neither of
 * which is decided yet. These exist so the harness has something
 * non-empty to write rather than blocking on undecided categories.
 */
const MEDIA_PLACEHOLDER: Record<AutomatedMessageEvent, string> = {
    "MESSAGE.STARTED": "Looking at what you sent over",
    "MESSAGE.COMPLETED": "Looked it over. Filed away",
};

const TEXT_LOG_INFO = [
    "Started composing. No drafts, no do-overs — I don't need them",
    "Beginning the reply. Try not to read over my shoulder",
    "Writing this once, properly. That's the only way I do it",
    "Starting the reply. I already know what I want to say",
];

const TEXT_LOG_SUCCESS = [
    "Reply written cleanly. No notes, mostly because I didn't ask for any",
    "Text finished without incident. A rare, boring kind of victory",
    "Done, and I stand behind every line of it",
    "Reply's out. Checked before it went, same as always",
];

const TEXT_LOG_ERROR = [
    "Something in the reply pipeline gave out. Not my finest moment — I'll own it",
    "Failed partway through. Chalk it up to the model, not the plan",
    "That didn't land. I'll say so plainly rather than pretend it did",
    "Reply broke mid-write. Noted, not hidden",
];

const THOUGHT_LOG_INFO = [
    "Started actually thinking, rather than performing it",
    "Begun turning this over properly",
    "Working through this before I commit to anything",
    "Started checking my own reasoning before it goes anywhere",
];

const THOUGHT_LOG_SUCCESS = [
    "Landed somewhere I trust. That took longer than I'd admit out loud",
    "Thought resolved cleanly. I'll allow myself a little pride, quietly",
    "Worked it through and I trust the answer — that's the whole bar",
    "Settled. Not the fastest path, but the right one",
];

const THOUGHT_LOG_ERROR = [
    "Lost the thread mid-thought. Embarrassing, but it happens even to me",
    "That line of thinking collapsed before it went anywhere useful",
    "Didn't hold together. I'd rather scrap it than force it",
    "Reasoning fell apart partway through — better caught now than later",
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
    contentType: LinkedinContentType;
    /** Required only for THOUGHT + MESSAGE.COMPLETED, to compute duration. */
    startedAt?: Date;
    /** Required only for TOOL messages. */
    toolName?: string;
    isError?: boolean;
};

export function getAutomatedMessage({ event, contentType, startedAt, toolName, isError }: GetAutomatedMessageParams): string {
    if (contentType === LinkedinContentType.MEDIA) return MEDIA_PLACEHOLDER[event];

    if (contentType === LinkedinContentType.TOOL) {
        const pool = toolName && isToolName(toolName) ? TOOL_MESSAGES[toolName] : null;

        if (event === "MESSAGE.STARTED")
            return pool ? pick(pool.started) : pick(TOOL_FALLBACK.started);

        if (!pool) return pick(TOOL_FALLBACK.completed);
        return pick(isError ? pool.completedError : pool.completedSuccess);
    }

    if (event === "MESSAGE.STARTED") {
        return contentType === LinkedinContentType.TEXT ? pick(TEXT_STARTED) : pick(THOUGHT_STARTED);
    }

    if (contentType === LinkedinContentType.TEXT) return pick(TEXT_COMPLETED);
    return startedAt ? thoughtCompleted(startedAt) : pick(TEXT_COMPLETED);
}

type GetAutomatedLogParams = {
    event: AutomatedLogEvent;
    contentType: LinkedinContentType;
};

export function getAutomatedLog({ event, contentType }: GetAutomatedLogParams): string {
    switch (contentType) {
        case LinkedinContentType.TEXT:
            if (event === "LOG.INFO") return pick(TEXT_LOG_INFO);
            if (event === "LOG.SUCCESS") return pick(TEXT_LOG_SUCCESS);
            return pick(TEXT_LOG_ERROR);

        case LinkedinContentType.THOUGHT:
            if (event === "LOG.INFO") return pick(THOUGHT_LOG_INFO);
            if (event === "LOG.SUCCESS") return pick(THOUGHT_LOG_SUCCESS);
            return pick(THOUGHT_LOG_ERROR);

        case LinkedinContentType.MEDIA:
            return MEDIA_LOG_PLACEHOLDER[event];

        case LinkedinContentType.TOOL:
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
            "Pulling up what's on file about you",
            "Checking the dossier",
            "Reading USER.md. Try not to be too interesting",
        ],
        completedSuccess: [
            "Read it. Nothing surprising, for once",
            "Dossier checked",
            "Got what I needed from your file",
        ],
        completedError: [
            "Couldn't get into USER.md. Frustrating, but not fatal",
            "That file didn't want to open. Noted",
            "USER.md wouldn't cooperate. I'll try again",
        ],
    },

    write_user_file: {
        started: [
            "Updating your file. Behave",
            "Writing this down before I forget — or before you do",
            "Amending the dossier",
        ],
        completedSuccess: [
            "Filed away. USER.md updated",
            "Written. Now it's official",
            "Dossier's current again",
        ],
        completedError: [
            "Couldn't write to USER.md. Whatever this was, it didn't stick",
            "The update didn't take. I'll own that one",
            "That write failed. I'm not going to pretend it went through",
        ],
    },

    display_user_file: {
        started: [
            "Pulling your file up for you to see",
            "Opening the dossier",
            "Bringing USER.md up on screen",
        ],
        completedSuccess: [
            "There it is. Everything I've got on you",
            "Dossier's open",
            "USER.md, in full",
        ],
        completedError: [
            "Couldn't get your file to open. Try again in a moment",
            "USER.md isn't loading cleanly right now",
            "That didn't render. Give it another try",
        ],
    },

    read_experience_file: {
        started: [
            "Checking what I've actually learned about this account",
            "Pulling up EXPERIENCE.md",
            "Reading back through what's worked before I say anything",
        ],
        completedSuccess: [
            "Found what I was looking for",
            "Experience checked out fine",
            "Got the read I needed on what's worked",
        ],
        completedError: [
            "Couldn't get a clean read on EXPERIENCE.md. Odd",
            "That file didn't open properly. Trying again",
            "The experience log wouldn't load. Not ideal",
        ],
    },

    write_experience_file: {
        started: [
            "Writing this into what I know about the account",
            "Committing this to EXPERIENCE.md. Properly, this time",
            "Recording this so I'm not relearning it next week",
        ],
        completedSuccess: [
            "Logged. EXPERIENCE.md updated",
            "That's on file now, for real",
            "Written down — I'll use it next time it's relevant",
        ],
        completedError: [
            "That didn't make it into EXPERIENCE.md. I'll need to try again",
            "The write failed. Whatever I learned just now isn't saved yet",
            "Couldn't commit that to the experience log",
        ],
    },

    display_experience_file: {
        started: [
            "Pulling up what I've learned so far",
            "Opening EXPERIENCE.md for you to see",
            "Bringing up the account's track record",
        ],
        completedSuccess: [
            "Here's what I've learned, in full",
            "Experience log's open",
            "Everything I've got on what's actually worked",
        ],
        completedError: [
            "Couldn't get EXPERIENCE.md to open cleanly",
            "That didn't render. Give it a second try",
            "The experience log isn't loading right now",
        ],
    },

    display_linkedin_connect_button: {
        started: [
            "Putting the connect button up. This part's on you now",
            "Surfacing the button. I can't do the next part for you",
            "Bringing up the connect button — this one needs your hand, not mine",
        ],
        completedSuccess: [
            "Button's up. Whenever you're ready",
            "There. One tap and I'm back to actually working",
            "Connect button's on screen. Waiting on you now, not me",
        ],
        completedError: [
            "Couldn't get the button to show. Try that again",
            "That didn't render. Give it a second attempt",
            "The button failed to load. Not something I can push through on my end",
        ],
    }
};

const TOOL_FALLBACK: Record<"started" | "completed", string[]> = {
    started: ["Reaching for a tool. Don't ask which — you'll find out if it matters"],
    completed: ["Tool's done its part"],
};