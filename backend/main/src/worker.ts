import { createAIChatMessage, updateAIChatMessage } from "./actions/chat/helpers/chatMessage";
import { generateAIResponse } from "./actions/chat/generateAIResponse";
import { MainMessageStatus } from "./generated/prisma";
import { Worker, type Job } from "bullmq";
import Redis from "ioredis";

const QUEUE_NAME = "chat-osamu-dazai"; // Error('Queue name cannot contain :');
const RPM = Number(process.env.MAIN_GEMINI_MAX_RPM ?? 60);

const connection = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    QUEUE_NAME,
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

worker.on("failed", async (job, err) => {
    const messageId = job?.data?.messageId;
    if (messageId)
        await updateAIChatMessage(messageId, MainMessageStatus.FAILED);
    console.error(`[${QUEUE_NAME}] job ${job?.id} failed:`, err);
});

process.on("SIGTERM", async () => {
    await worker.close();
    await connection.quit();
    process.exit(0);
});