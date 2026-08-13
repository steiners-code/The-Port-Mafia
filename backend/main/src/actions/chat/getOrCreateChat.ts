import { prisma } from "../../lib/db";

export async function getOrCreateChat(userId: string) {
    try {
        const data = await prisma.mainChat.upsert({
            where: { userId },
            create: { userId },
            update: {},
            select: {
                id: true,
                messages: {
                    select: {
                        id: true,
                        createdAt: true,
                        triggerType: true,
                        contents: {
                            select: {
                                id: true,
                                contentType: true,
                                status: true,
                                message: true,
                                output: true,
                            },
                            orderBy: [
                                { createdAt: 'asc' },
                                { sequence: 'asc' }
                            ]
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 50
                },
            }
        })

        data.messages = data.messages.reverse();

        return {
            success: true,
            status: 200,
            message: "Chat history retrieved successfully.",
            data,
        }
    } catch (error) {
        console.error(error);

        return {
            success: false,
            status: 500,
            message: "Couldn't retrieve chat history.",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}