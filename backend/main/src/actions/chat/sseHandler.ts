import Redis from "ioredis";

const AGENT_ID = "osamu-dazai";

function channelKey(agentId: string) {
    return `sse:${agentId}`;
}

const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Opens a dedicated Redis connection in subscribe mode for this request,
 * forwards every message published on the agent's channel as an SSE
 * `message` event, and tears the subscription down when the client
 * disconnects. A subscriber connection can't run other Redis commands,
 * which is why this is a fresh connection per request rather than the
 * shared publisher client used elsewhere.
 */
export function sseHandler() {
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();
            const subscriber = new Redis(process.env.REDIS_URL!);

            let closed = false;

            function send(payload: string) {
                if (closed) return;
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }

            subscriber.subscribe(channelKey(AGENT_ID)).catch((err) => {
                console.error("[sse] subscribe failed:", err);
                controller.error(err);
            });

            subscriber.on("message", (_channel, message) => {
                send(message);
            });

            const heartbeat = setInterval(() => {
                if (closed) return;
                controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            }, HEARTBEAT_INTERVAL_MS);

            cleanup = () => {
                if (closed) return;
                closed = true;
                clearInterval(heartbeat);
                subscriber.unsubscribe(channelKey(AGENT_ID)).catch(() => { });
                subscriber.quit().catch(() => { });
            };
        },
        cancel() {
            cleanup?.();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}