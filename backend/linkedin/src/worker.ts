import { generateStrategistResponse } from "./actions/chat/strategist/generateStrategistResponse";
import { createAIChatMessage, updateAIChatMessage } from "./actions/chat/helpers/chatMessage";
import { generateObserverResponse } from "./actions/chat/observer/generateObserverResponse";
import { generateAnalystResponse } from "./actions/chat/analyst/generateAnalystResponse";
import { generateWriterResponse } from "./actions/chat/writer/generateWriterResponse";
import { generateAIResponse } from "./actions/chat/generateAIResponse";
import { LinkedinMessageStatus } from "./generated/prisma";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";

const RPM = Number(process.env.LINKEDIN_GEMINI_MAX_RPM ?? 60);

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

/**
 * Shared by every worker below — messageId failures update the same
 * LinkedinChatMessage status regardless of which stage's queue failed,
 * since A/B/C/D all share the one-message-per-run model with chat.
 */
function registerFailureHandler(worker: Worker, queueName: string, role: string) {
    worker.on("failed", async (job, err) => {
        const messageId = job?.data?.messageId;
        const userId = job?.data?.userId;

        console.error(
            `[${queueName}] role=${role} jobId=${job?.id} userId=${userId ?? "unknown"} messageId=${messageId ?? "unknown"} failed:`,
            err
        );

        if (messageId)
            await updateAIChatMessage(messageId, LinkedinMessageStatus.FAILED);
    });

    worker.on("error", (err) => {
        console.error(`[${queueName}] role=${role} worker-level error (not job-specific):`, err);
    });
}

// ---------------------------------------------------------------------------
// chat-maha-balor — unchanged from the existing worker
// ---------------------------------------------------------------------------

const CHAT_QUEUE_NAME = "chat-maha-balor";

const chatWorker = new Worker(
    CHAT_QUEUE_NAME,
    async (job: Job) => {
        if (!job.data.messageId)
            job.data.messageId = await createAIChatMessage(job.data.chatId);
        await generateAIResponse({ ...job.data });
    },
    {
        connection,
        concurrency: 1,
        limiter: { max: RPM, duration: 60_000 },
    }
);

registerFailureHandler(chatWorker, CHAT_QUEUE_NAME, "HANDLER");

// ---------------------------------------------------------------------------
// analyst-maha-balor
// ---------------------------------------------------------------------------

const ANALYST_QUEUE_NAME = "analyst-maha-balor";

const analystWorker = new Worker(
    ANALYST_QUEUE_NAME,
    async (job: Job) => {
        // messageId is always already created by triggerAnalystResponse
        // before this job is enqueued — never resolved here. A missing
        // messageId at this point is a real bug upstream, not a case to
        // silently patch over.
        if (!job.data.messageId) {
            throw new Error(`[${ANALYST_QUEUE_NAME}] job ${job.id} has no messageId — triggerAnalystResponse must create it before enqueueing.`);
        }
        await generateAnalystResponse({ ...job.data });
    },
    {
        connection,
        concurrency: 1,
        limiter: { max: RPM, duration: 60_000 },
    }
);

registerFailureHandler(analystWorker, ANALYST_QUEUE_NAME, "ANALYST");

// ---------------------------------------------------------------------------
// strategist-maha-balor
// ---------------------------------------------------------------------------

const STRATEGIST_QUEUE_NAME = "strategist-maha-balor";

const strategistWorker = new Worker(
    STRATEGIST_QUEUE_NAME,
    async (job: Job) => {
        if (!job.data.messageId) {
            throw new Error(`[${STRATEGIST_QUEUE_NAME}] job ${job.id} has no messageId — triggerStrategistResponse/handleStrategistTaskReport must set it before enqueueing.`);
        }
        await generateStrategistResponse({ ...job.data });
    },
    {
        connection,
        concurrency: 1,
        limiter: { max: RPM, duration: 60_000 },
    }
);

registerFailureHandler(strategistWorker, STRATEGIST_QUEUE_NAME, "STRATEGIST");

// ---------------------------------------------------------------------------
// observer-maha-balor
// ---------------------------------------------------------------------------

const OBSERVER_QUEUE_NAME = "observer-maha-balor";

const observerWorker = new Worker(
    OBSERVER_QUEUE_NAME,
    async (job: Job) => {
        if (!job.data.messageId) {
            throw new Error(`[${OBSERVER_QUEUE_NAME}] job ${job.id} has no messageId — triggerObserverResponse/handleObserverTaskReport must set it before enqueueing.`);
        }
        await generateObserverResponse({ ...job.data });
    },
    {
        connection,
        concurrency: 1,
        limiter: { max: RPM, duration: 60_000 },
    }
);

registerFailureHandler(observerWorker, OBSERVER_QUEUE_NAME, "OBSERVER");

// ---------------------------------------------------------------------------
// writer-maha-balor
// ---------------------------------------------------------------------------

const WRITER_QUEUE_NAME = "writer-maha-balor";

const writerWorker = new Worker(
    WRITER_QUEUE_NAME,
    async (job: Job) => {
        if (!job.data.messageId) {
            throw new Error(`[${WRITER_QUEUE_NAME}] job ${job.id} has no messageId — triggerWriterResponse must set it before enqueueing.`);
        }
        await generateWriterResponse({ ...job.data });
    },
    {
        connection,
        concurrency: 1,
        limiter: { max: RPM, duration: 60_000 },
    }
);

registerFailureHandler(writerWorker, WRITER_QUEUE_NAME, "WRITER");

// ---------------------------------------------------------------------------
// shutdown
// ---------------------------------------------------------------------------

process.on("SIGTERM", async () => {
    await Promise.all([
        chatWorker.close(),
        analystWorker.close(),
        strategistWorker.close(),
        observerWorker.close(),
        writerWorker.close(),
    ]);
    await connection.quit();
    process.exit(0);
});