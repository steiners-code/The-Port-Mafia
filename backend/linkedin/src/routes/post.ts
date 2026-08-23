import Elysia, { t } from "elysia";
import { getPostById } from "../actions/post/getPostById";

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
})

const postId = t.Object({
    postId: t.String({ minLength: 1 })
})

export const postRoutes = new Elysia({ prefix: '/post' })
    .get('/', async ({ headers, status, query }) => {
        const { success, data, ...res } = await getPostById(query["postId"], headers["x-user-id"]);

        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data);
    }, {
        headers: userId,
        query: postId,
    })