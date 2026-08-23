import { requestPostPerformance } from "./requestPostPerformance";
import { prisma } from "../../lib/db";
import { subDays } from "date-fns";

export async function triggerPostPerformanceRequest(userId: string) {
    const past7days = subDays(new Date(), 7);

    const posts = await prisma.linkedinPost.findMany({
        where: { userId, createdAt: { gte: past7days } },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' }
    })

    const mappedPosts = posts.map(p => ({ postId: p.id, title: p.title }))

    if (mappedPosts.length === 0) return;

    await requestPostPerformance(userId, mappedPosts)
}