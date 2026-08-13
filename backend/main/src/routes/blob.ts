import { generateTokens } from "../actions/blob/generateTokens";
import Elysia, { t } from "elysia";

export const blobRoutes = new Elysia({ prefix: '/blob' })
    .get("/upload-auth", ({ status }) => {
        const { success, data, ...res } = generateTokens();
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data);
    }, {
        headers: t.Object({
            "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
        })
    })