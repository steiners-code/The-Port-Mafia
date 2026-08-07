import { AppStatus, AppType, SubAgent } from "../../../generated/prisma";

export type Connections = {
    app: AppType,
    status: AppStatus,
}[]

type AgentDefinition = {
    subAgent: SubAgent;
    platform: AppType;
    name: string;
    description: string;
};

export const AGENT_REGISTRY: AgentDefinition[] = [
    {
        subAgent: SubAgent.MAHA,
        platform: AppType.LINKEDIN,
        name: "Maha",
        description: "writes and manages LinkedIn posts, observes performance",
    },
];

export async function getAgentRoster(connections: Connections): Promise<string> {
    const statusByPlatform = new Map(
        connections.map((c) => [c.app, c.status])
    );

    const lines = AGENT_REGISTRY.map((agent) => {
        const status = statusByPlatform.get(agent.platform) ?? AppStatus.DISCONNECTED;
        return `- ${agent.name} — ${agent.platform} — ${agent.description} — ${status}`;
    });

    return ["## Your Subordinate Agents", ...lines].join("\n");
}