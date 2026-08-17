import { createQuestionnaireTask } from "./createQuestionnaireTask";
import { triggerDazaiForTask } from "../cron/triggerDazaiForTask";
import { CreateTaskBody, MainTask } from "../../lib/types";
import { MainTaskStatus } from "../../generated/prisma";
import { prisma } from "../../lib/db";

export async function createTask(userId: string, data: CreateTaskBody) {
    let content: MainTask["content"] = [];

    try {
        switch (data.type) {
            case "QUESTIONNAIRE":
                content = await createQuestionnaireTask(data.questions)
                break;
        }

        if (!content) throw new Error("Unable to process request.")

        const task = await prisma.mainTask.create({
            data: {
                userId,
                content,
                type: data.type,
                title: data.title,
                subAgent: data.subAgent,
                subAgentPlatform: data.subAgentPlatform,
                subAgentRole: data.subAgentRole,
                status: MainTaskStatus.PENDING,
            },
            select: {
                id: true,
                level: true,
                status: true,
                user: { select: { firstName: true, lastName: true } }
            }
        })

        const principalName = [task.user.firstName, task.user.lastName]
            .filter(Boolean)
            .join(' ');

        await triggerDazaiForTask(userId, principalName, {
            ...data,
            content,
            id: task.id,
            level: task.level,
            status: task.status
        })

        return {
            status: 200,
            success: true,
            message: "Successfully created the task!"
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Failed to create the task!",
            details: error instanceof Error ? error.message : "Internal Server Error."
        }
    }
}