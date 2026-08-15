import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Flavor lines shown while a message sits at PENDING, keyed by agent id.
 * Each pool should stay in that agent's register — Dazai's SOUL (teasing,
 * unshakeably confident) vs Maha's (verify-before-trust, business-proud).
 * Add pools here as new agents come online; unknown ids fall back to a
 * neutral line rather than crashing.
 */
const PENDING_MESSAGES: Record<string, string[]> = {
    "osamu-dazai": [
        "Already three moves ahead of this one.",
        "Thinking. Try to contain your excitement.",
        "Give me a second — I like to look competent doing this.",
        "Working on it. Don't tell anyone how hard.",
        "This one's almost too easy. Almost.",
    ],
    "maha-balor": [
        "Checking the numbers before I say a word.",
        "Not guessing. Verifying.",
        "One moment — I'd rather be right than fast.",
        "Running this like it's mine, because it is.",
        "Give me a beat, I'm not skimming this one.",
    ],
};

const FALLBACK_MESSAGES = ["Working on it..."];
const ROTATE_INTERVAL_MS = 2500;

export function PendingMessage({ agentId, className }: { agentId: string; className?: string }) {
    const pool = PENDING_MESSAGES[agentId] ?? FALLBACK_MESSAGES;
    const [index, setIndex] = useState(0);

    useEffect(() => {
        setIndex(0);
        if (pool.length <= 1) return;

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % pool.length);
        }, ROTATE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [pool]);

    return (
        <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
            <Loader size={12} className="animate-spin" />
            <span className="text-xs italic text-shine">{pool[index]}</span>
        </div>
    );
}