import { prisma } from "../../lib/db";

export async function getChatId(userId: string) {
    const [linkedinProfile, chat] = await prisma.$transaction([
        prisma.linkedinProfile.findUnique({
            where: { userId },
            select: { given_name: true, family_name: true }
        }),
        prisma.linkedinChat.upsert({
            where: { userId },
            create: { userId },
            update: {},
            select: { id: true }
        }),
    ]);

    const principalName = [linkedinProfile?.given_name || "User", linkedinProfile?.family_name || null]
        .filter(Boolean)
        .join(' ');

    return { chatId: chat.id, principalName, linkedinConnected: Boolean(linkedinProfile) };
}