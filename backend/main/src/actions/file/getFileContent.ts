import { File } from "../../lib/types";
import { prisma } from "../../lib/db";

export async function getFileContent(userId: string, fileType: File["fileType"]) {
    try {
        const data = await prisma.mainFile.findUnique({
            where: { userId_fileType: { userId, fileType } },
            select: { content: true }
        })

        if (!data) return {
            status: 404,
            success: true,
            message: `Couldn't retrieve ${fileType}.md's content.`,
            details: `${fileType}.md is empty or doesn't exist yet.`,
        }

        return {
            status: 200,
            success: true,
            message: `${fileType}.md's content retrieved.`,
            data: data.content,
        }
    } catch (error) {
        return {
            status: 500,
            success: true,
            message: `Couldn't retrieve ${fileType}.md's content.`,
            details: error instanceof Error ? error.message : "Internal Server Error!",
        }
    }
}