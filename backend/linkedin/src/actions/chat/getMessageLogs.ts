import { prisma } from "../../lib/db";

export async function getMessageLogs(messageId: string) {
    try {
        const messageLogs = await prisma.linkedinMessageContent.findMany({
            where: { chatMessageId: messageId },
            select: {
                id: true,
                contentType: true,
                status: true,
                createdAt: true,
                logs: {
                    select: {
                        id: true,
                        level: true,
                        message: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'asc'
                    },
                },
            },
            orderBy: [
                { createdAt: 'asc' },
                { sequence: 'asc' },
            ]
        });

        const usageLogs = await prisma.linkedinMessageUsage.findMany({
            where: { messageId },
            select: {
                id: true,
                inputTokens: true,
                outputTokens: true,
                totalTokens: true,
            }
        })

        if (messageLogs.length === 0)
            return {
                status: 404,
                message: "Message contents not found!",
                details: "Seems like Maha ditched you. BTW, check that messageId."
            }

        return {
            status: 200,
            success: true,
            message: "Successfully grabbed Maha's log book.",
            data: { messageLogs, usageLogs },
        }
    } catch (error) {
        return {
            status: 500,
            success: true,
            message: "Failed to grab Maha's log book.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        }
    }
}