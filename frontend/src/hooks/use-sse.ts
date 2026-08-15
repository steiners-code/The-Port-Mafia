import { useEffect, useRef } from "react";
import { getChatUrl } from "@/lib/utils";
import { Agent } from "@/data/agents";

export function useSSE<T>(agenRoute: Agent["route"], onEvent: (event: T) => void) {
    const url = getChatUrl("/sse", agenRoute)
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        if (!url) return;

        const es = new EventSource(url, { withCredentials: true });

        es.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data) as T;
                onEventRef.current(data);
            } catch (err) {
                console.error("[useSSE] failed to parse event:", err);
            }
        };

        es.onerror = (err) => {
            console.error("[useSSE] connection error:", err);
        };

        return () => es.close();
    }, [url]);
}