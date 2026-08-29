import { tokenExchange } from '../actions/auth/token-exchange';
import { Elysia, t } from 'elysia';

export const authRoutes = new Elysia({ prefix: '/auth' })
    .post("/exchange", async ({ body, status, headers }) => {
        const userId = headers["x-user-id"];

        const { code, redirect_uri, timezone } = body;

        if (!code || !redirect_uri) {
            return status(400, { error: "Missing authorization code or redirect URI" });
        }

        const res = await tokenExchange(code, redirect_uri, userId, timezone);

        return status(res.status, res.message)
    }, {
        headers: t.Object({
            'x-user-id': t.String({ error: "Unauthorized: Missing API Gateway User ID" })
        }),
        body: t.Object({
            code: t.String({ error: "Missing Input: \'code\' is required", minLength: 1 }),
            redirect_uri: t.String({ error: "Missing Input: \'redirect_uri\' is required", minLength: 1 }),
            timezone: t.String({ error: "Missing Input: \'timezone\' is required", minLength: 1 })
        })
    })