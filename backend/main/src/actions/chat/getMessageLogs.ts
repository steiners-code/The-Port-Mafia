import { prisma } from "../../lib/db";

export async function getMessageLogs(messageId: string) {
    try {
        const data = await prisma.mainMessageContent.findMany({
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

        if (!data)
            return {
                status: 404,
                message: "Message contents not found!",
                details: "Seems like Dazai ditched you. BTW, check that messageId."
            }

        return {
            status: 200,
            success: true,
            message: "Successfully grabbed Dazai's log book.",
            data,
        }
    } catch (error) {
        return {
            status: 500,
            success: true,
            message: "Successfully grabbed Dazai's log book.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        }
    }
}