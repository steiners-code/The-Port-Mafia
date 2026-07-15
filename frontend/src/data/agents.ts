export type AgentFeature = {
  id: string;
  label: string;
  description: string;
};

export type Agent = {
  id: string;
  name: string;
  codename: string;
  avatarSrc?: string;
  platform: string;
  route: string;
  colors: {
    text: string,
    background: string,
  }
};

/**
 * Agent roster. avatarSrc is intentionally left undefined until
 * character art is commissioned — AgentAvatar falls back to a
 * monogram so the UI never depends on an image existing.
 */
export const agents: Agent[] = [
  {
    id: "osamu-dazai",
    name: "Osamu Dazai",
    codename: "No Longer Human",
    avatarSrc: "/dazai-avatar.png",
    platform: 'Main',
    route: '/main',
    colors: {
      text: "text-[#3F332B] dark:text-[#B59B76]",
      background: "bg-[#3F332B]/20 dark:bg-[#B59B76]/20",
    },
  },
  {
    id: "maha-balor",
    name: "Maha Balor",
    codename: "Orphan Merchandise",
    avatarSrc: "/maha-avatar.png",
    platform: 'LinkedIn',
    route: '/linkedin',
    colors: {
      text: "text-[#5261B0] dark:text-[#7794D1]",
      background: "bg-[#5261B0]/20 dark:bg-[#7794D1]/20",
    },
  },
];

export const getAgentById = (id: string) => agents.find((agent) => agent.id === id);