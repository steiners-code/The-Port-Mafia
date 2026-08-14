import { prisma } from "../../lib/db";

export async function getOrCreateChat(userId: string, cursor?: { createdAt: Date; id: string }) {
    try {
        const chat = await prisma.mainChat.upsert({
            where: { userId },
            create: { userId },
            update: {},
            select: { id: true }
        });

        const messages = await prisma.mainChatMessage.findMany({
            where: {
                chatId: chat.id,
                ...(cursor && {
                    OR: [
                        { createdAt: { lt: cursor.createdAt } },
                        { createdAt: cursor.createdAt, id: { lt: cursor.id } }
                    ]
                })
            },
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
                        sequence: true,
                    },
                    orderBy: [{ createdAt: 'asc' }, { sequence: 'asc' }]
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 51
        });

        const hasMore = messages.length > 50;
        const page = messages.slice(0, 50).reverse();

        return {
            success: true,
            status: 200,
            message: "Chat history retrieved successfully.",
            data: { id: chat.id, messages: page, hasMore },
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            status: 500,
            message: "Couldn't retrieve chat history.",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        };
    }
}