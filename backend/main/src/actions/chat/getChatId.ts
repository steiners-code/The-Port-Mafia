import { prisma } from "../../lib/db";

export async function getChatId(userId: string) {
    const chat = await prisma.mainChat.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true }
    });

    return chat.id;
}