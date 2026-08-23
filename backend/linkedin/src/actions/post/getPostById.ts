import { prisma } from "../../lib/db";

export async function getPostById(postId: string, userId: string) {
    try {
        const data = await prisma.linkedinPost.findUnique({
            where: { id: postId, userId },
            include: {
                performance: true,
                techniques: true,
                slotUsage: true
            }
        });

        if (!data) return {
            success: false,
            status: 404,
            message: "Post Not Found!",
            details: "Invalid postId or user doesn't own this post."
        }

        return {
            success: true,
            status: 200,
            message: "Post Found!",
            data,
        }
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Post Not Found!",
            details: error instanceof Error ? error.message : "Internal Server Error!"
        }
    }
}