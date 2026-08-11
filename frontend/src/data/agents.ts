export type AgentFeature = {
  id: string;
  label: string;
  description: string;
};

export type Agent = {
  id: string;
  name: string;
  warning: string;
  quote: string;
  avatarSrc?: string;
  platform: string;
  route: string;
  colors: {
    text: string,
    background: string,
    file: string,
    message: string,
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
    warning: "Never commit a double suicide with him.",
    quote: "I want to die without trying. Will you commit a double suicide with me?",
    avatarSrc: "/dazai-avatar.png",
    platform: 'Main',
    route: '/main',
    colors: {
      text: "text-[#3F332B] dark:text-[#B59B76]",
      background: "bg-[#B59B76]/20 dark:bg-[#3F332B]/20",
      file: "bg-[#B59B76] dark:bg-[#856539] text-[#856539] dark:text-[#B59B76]",
      message: "text-[hsl(27,31%,30%)] dark:text-[hsl(27,31%,99%)] bg-[hsl(27,31%,50%)]/20! dark:bg-[hsl(27,31%,25%)]!",
    },
  },
  {
    id: "maha-balor",
    name: "Maha Balor",
    warning: "Never let her seduce you.",
    quote: "Brother Illugh! You may call me your sister, but your body seems to be telling the truth!",
    avatarSrc: "/maha-avatar.png",
    platform: 'LinkedIn',
    route: '/linkedin',
    colors: {
      text: "text-[#5261B0] dark:text-[#7794D1]",
      background: "bg-[#7794D1]/30 dark:bg-[#5261B0]/30",
      file: "bg-[#7794D1] dark:bg-[#5261B0] text-[#5261B0] dark:text-[#7794D1]",
      message: "text-[#5261B 0] dark:text-[#7794D 1] bg-[#7794D1]/20! dark:bg-[#5261B0]/40!",
    },
  },
];

export const getAgentByPathname = (pathname: string) => agents.find((agent) => agent.route === pathname);