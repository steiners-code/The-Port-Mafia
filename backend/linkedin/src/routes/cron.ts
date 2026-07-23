import { cronTokenRefresh } from "../actions/auth/token-refresh";
import { verifySystemSecret } from "../lib/crypto";
import Elysia, { t } from "elysia";

export const cronRoutes = new Elysia({ prefix: '/cron' })
    .get("/token-refresh", async ({ headers, status }) => {
        const cronSecret = headers["x-cron-secret"];

        if (!cronSecret || !verifySystemSecret(cronSecret))
            return status(401, { error: "Unauthorized system call." });

        const res = await cronTokenRefresh();

        return status(res.status, { message: res.message, ...res.data })
    }, {
        headers: t.Object({
            "x-cron-secret": t.String({ error: "Unauthorized: Missing system validation secret" }),
        })
    })
