import { useEffect, useRef } from "react";
import { Agent } from "@/data/agents";

const AGENT_SLUGS: Record<Agent["route"], string> = {
    "/main": "main",
    "/linkedin": "linkedin",
};

export function useSSE<T>(agentRoute: Agent["route"], onEvent: (event: T) => void) {
    const url = `/api/stream/${AGENT_SLUGS[agentRoute]}`;
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        const es = new EventSource(url);

        es.onmessage = (e) => {
            try {
                onEventRef.current(JSON.parse(e.data) as T);
            } catch (err) {
                console.error("[useSSE] failed to parse event:", err);
            }
        };

        es.onerror = (err) => {
            console.error("[useSSE] connection error:", JSON.stringify(err, null, 4));
        };

        return () => es.close();
    }, [url]);
}