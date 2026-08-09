import { MainContentType } from "../../../generated/prisma";

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
};

export function getAutomatedMessage({ event, contentType, startedAt }: GetAutomatedMessageParams): string {
    switch (contentType) {
        case MainContentType.TEXT:
            return event === "MESSAGE.STARTED" ? pick(TEXT_STARTED) : pick(TEXT_COMPLETED);

        case MainContentType.THOUGHT:
            if (event === "MESSAGE.STARTED") return pick(THOUGHT_STARTED);
            return startedAt ? thoughtCompleted(startedAt) : pick(TEXT_COMPLETED);

        case MainContentType.MEDIA:
            return MEDIA_PLACEHOLDER[event];

        case MainContentType.TOOL:
            return TOOL_PLACEHOLDER[event];
    }
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