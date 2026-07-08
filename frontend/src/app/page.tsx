import { agents } from "@/data/agents";

/**
 * Placeholder for Dazai's command view. Deliberately unbuilt beyond a
 * quiet holding state — the compiled cross-platform digest, chat entry
 * point, and advisory panel land here once the platform agents exist
 * to report back to him.
 */
export default function HomePage() {
  const dazai = agents.find((agent) => agent.id === "dazai")!;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <div className="space-y-1.5">
        <h1 className="pm-heading-1">{dazai.name}</h1>
        <p className="pm-subheading max-w-sm">{dazai.tagline}</p>
      </div>
      <p className="pm-body-sm max-w-xs">
        No dispatches yet. Once an agent below reports in, Dazai compiles it here.
      </p>
    </div>
  );
}
