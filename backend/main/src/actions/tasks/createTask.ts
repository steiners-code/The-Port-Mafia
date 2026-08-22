import { createPostPerformanceTask } from "./createPostPerformanceTask";
import { createAccountSnapshotTask } from "./createAccountSnapshotTask";
import { createQuestionnaireTask } from "./createQuestionnaireTask";
import { triggerDazaiForTask } from "../cron/triggerDazaiForTask";
import { CreateTaskBody, MainTask } from "../../lib/types";
import { MainTaskStatus } from "../../generated/prisma";
import { prisma } from "../../lib/db";
import { t } from "elysia";

const mahaLinkedInTaskBody = t.Object({
    title: t.String({ minLength: 1 }),
    type: t.Literal("QUESTIONNAIRE"),
    subAgent: t.Literal("MAHA"),
    subAgentPlatform: t.Literal("LINKEDIN"),
    subAgentRole: t.Union([
        t.Literal("OBSERVER"),
        t.Literal("STRATEGIST"),
    ]),
    questions: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
});

const mahaPostPerformanceTaskBody = t.Object({
    title: t.String({ minLength: 1 }),
    type: t.Literal("POST_PERFORMANCE"),
    subAgent: t.Literal("MAHA"),
    subAgentPlatform: t.Literal("LINKEDIN"),
    subAgentRole: t.Literal("HANDLER"),
    content: t.Array(t.Object({
        title: t.String({ minLength: 1 }),
        postId: t.String({ minLength: 1 }),
    }))
});

const mahaAccountSnapshotTaskBody = t.Object({
    title: t.String({ minLength: 1 }),
    type: t.Literal("ACCOUNT_SNAPSHOT"),
    subAgent: t.Literal("MAHA"),
    subAgentPlatform: t.Literal("LINKEDIN"),
    subAgentRole: t.Literal("HANDLER"),
    content: t.Object({
        date: t.String({ minLength: 1 }),
    })
});

export const createTaskBody = t.Union([mahaLinkedInTaskBody, mahaPostPerformanceTaskBody, mahaAccountSnapshotTaskBody]);

export async function createTask(userId: string, data: CreateTaskBody) {
    let content: MainTask["content"] = [];

    try {
        switch (data.type) {
            case "QUESTIONNAIRE":
                content = createQuestionnaireTask(data.questions)
                break;
            case "POST_PERFORMANCE":
                content = createPostPerformanceTask(data.content)
                break;
            case "ACCOUNT_SNAPSHOT":
                content = createAccountSnapshotTask(data.content)
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
        } as MainTask)

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