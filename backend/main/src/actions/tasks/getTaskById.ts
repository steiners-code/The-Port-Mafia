import { prisma } from "../../lib/db";

export async function getTaskById(userId: string, taskId: string) {
    try {
        const task = await prisma.mainTask.findUnique({
            where: { userId, id: taskId },
            include: {
                comments: true,
            }
        })

        if (!task) return {
            success: false,
            status: 400,
            message: "Task Not Found!",
            details: "Either Task ID: id is invalid or the task is not owned by requesting."
        }

        return {
            success: true,
            status: 200,
            message: "Task data found!",
            data: task,
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Couldn't get task data.",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}