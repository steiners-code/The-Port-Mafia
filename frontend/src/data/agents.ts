export type AgentFeature = {
  id: string;
  label: string;
  description: string;
};

export type Agent = {
  id: string;
  name: string;
  codename: string;
  platform: string;
  role: string;
  tagline: string;
  bio: string;
  avatarSrc?: string;
  route: string;
  features: AgentFeature[];
};

/**
 * Agent roster. avatarSrc is intentionally left undefined until
 * character art is commissioned — AgentAvatar falls back to a
 * monogram so the UI never depends on an image existing.
 */
export const agents: Agent[] = [
  {
    id: "dazai",
    name: "Osamu Dazai",
    codename: "The Handler",
    platform: "Command",
    role: "Oversight & Advisory",
    tagline: "He doesn't post. He decides what's worth posting about.",
    bio: "Dazai sits above every channel, compiling what each agent brings back and turning it into direction. He is the only one who talks to you directly.",
    route: "/",
    features: [],
  },
  {
    id: "maha",
    name: "Maha Balor",
    codename: "The Ledger",
    platform: "LinkedIn",
    role: "Network & Revenue",
    tagline: "She turned an inheritance she never got into a network worth more than the one she lost.",
    bio: "Merchant's daughter, self-taught in the arithmetic of favors. On LinkedIn, every connection is a line item — Maha keeps the books.",
    route: "/linkedin",
    features: [
      {
        id: "reconnaissance",
        label: "Lead Reconnaissance",
        description:
          "She reads a thousand profiles before you've finished your coffee, and only surfaces the ones worth your time.",
      },
      {
        id: "outreach",
        label: "Ghostwritten Outreach",
        description:
          "Connection requests and follow-ups drafted in a voice indistinguishable from yours — sent while you're doing anything else.",
      },
      {
        id: "dispatch",
        label: "Content Dispatch",
        description:
          "Posts and articles written, timed, and released on a schedule she keeps better than most people keep promises.",
      },
      {
        id: "ledger",
        label: "Network Ledger",
        description:
          "Growth, engagement, and warm leads tracked like accounts receivable — nothing gets forgotten, nothing goes uncollected.",
      },
      {
        id: "alerts",
        label: "Silent Alerts",
        description:
          "When a reply is worth real money or real risk, she stops working quietly and puts it in front of you.",
      },
    ],
  },
];

export const getAgentById = (id: string) => agents.find((agent) => agent.id === id);
