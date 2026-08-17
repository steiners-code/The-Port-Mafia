import { prisma } from "../../lib/db"

type Filters = {}

export async function getMainTasks(userId: string, filters?: Filters) {
    try {
        const data = await prisma.mainTask.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                content: true,
                level: true,
                status: true,
                comments: true,
                subAgent: true,
                subAgentPlatform: true,
                subAgentRole: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        return {
            status: 200,
            success: true,
            data: data,
            message: "Successfully retrieved tasks!"
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Unable to fetch tasks",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}