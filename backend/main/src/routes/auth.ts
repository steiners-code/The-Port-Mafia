import { authorizeUser, refreshJWT } from "../actions/auth/authorize-user";
import { authConfig } from "../lib/auth-config";
import Elysia, { t } from "elysia";

export const authRoutes = new Elysia({ prefix: '/auth' })
    .use(authConfig)
    .post("/connect-home", async ({ query, jwt, status, headers }) => {
        const { pid, redirect_uri } = query;

        const ipAddress = headers['x-forwarded-for'] || null;
        const userAgent = headers['user-agent'] || null;

        const { success, payload, refreshToken, ...res } = await authorizeUser(pid, ipAddress, userAgent, redirect_uri);
        if (!success || !payload || !refreshToken) return status(res.status, { message: res.message, details: res?.details })

        const auth = await jwt.sign(payload);

        return status(res.status, {
            auth,
            refreshToken,
            redirectUrl: res.redirectUrl
        })
    })

    .post("/refresh", async ({ cookie: { refresh }, jwt, status, headers }) => {
        const ipAddress = headers['x-forwarded-for'] || null;
        const userAgent = headers['user-agent'] || null;
        const irToken = refresh.value as string;

        const { refreshToken, payload, ...res } = await refreshJWT(irToken, ipAddress, userAgent);

        if (!refreshToken) return status(res.status, { code: res.code, message: res.message, details: res.details })

        const auth = await jwt.sign(payload);

        return status(res.status, {
            code: res.code,
            auth,
            refreshToken,
        })
    }, {
        cookie: t.Cookie({
            refresh: t.String({ error: "Missing: Cookie `refresh` is required." }),
        })
    })