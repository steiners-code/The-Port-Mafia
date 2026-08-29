import { PostPerformance, PostPerformanceTaskBody } from "../../lib/types";

export function createPostPerformanceTask(posts: PostPerformanceTaskBody["content"]): PostPerformance[] {
    try {
        const content: PostPerformance[] = posts.map(p => ({
            ...p,
            impressions: null,
            reactions: null,
            comments: null,
            reposts: null,
        }))

        return content;
    } catch (error) {
        console.error(error);
        throw new Error("Unable to create post performance sheet.")
    }
}