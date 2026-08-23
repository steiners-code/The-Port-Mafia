import { cronWorkflowTrigger } from "../actions/cron/cronWorkflowTrigger";
import { cronTokenRefresh } from "../actions/auth/token-refresh";
import { verifySystemSecret } from "../lib/crypto";
import Elysia, { t } from "elysia";

const cronSecret = t.Object({
    "x-cron-secret": t.String({ error: "Unauthorized: Missing system validation secret" }),
})

export const cronRoutes = new Elysia({ prefix: '/cron' })
    .get('/token-refresh', async ({ headers, status }) => {
        const cronSecret = headers["x-cron-secret"];

        if (!cronSecret || !verifySystemSecret(cronSecret))
            return status(401, { error: "Unauthorized system call." });

        const tokenRefreshRes = await cronTokenRefresh();;

        return status(200, tokenRefreshRes)
    }, { headers: cronSecret })

    .get('/trigger', async ({ headers, status }) => {
        const cronSecret = headers["x-cron-secret"];

        if (!cronSecret || !verifySystemSecret(cronSecret))
            return status(401, { error: "Unauthorized system call." });

        const workflowTriggerRes = await cronWorkflowTrigger()

        return status(200, workflowTriggerRes)
    }, { headers: cronSecret })
