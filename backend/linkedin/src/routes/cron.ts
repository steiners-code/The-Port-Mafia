import { triggerCron } from "../actions/cron/triggerCron";
import { verifySystemSecret } from "../lib/crypto";
import Elysia, { t } from "elysia";

const cronSecret = t.Object({
    "x-cron-secret": t.String({ error: "Unauthorized: Missing system validation secret" }),
})

export const cronRoutes = new Elysia({ prefix: '/cron' })
    .get('/trigger', async ({ headers, status }) => {
        const cronSecret = headers["x-cron-secret"];

        if (!cronSecret || !verifySystemSecret(cronSecret))
            return status(401, { error: "Unauthorized system call." });

        const res = await triggerCron();

        return status(200, res)
    }, { headers: cronSecret })
