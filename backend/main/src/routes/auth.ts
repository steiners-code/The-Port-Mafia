import { authorizeUser, refreshJWT } from "../actions/auth/authorize-user";
import { authConfig } from "../lib/auth-config";
import Elysia, { t } from "elysia";

export const authRoutes = new Elysia({ prefix: '/auth' })
    .use(authConfig)
    .post("/connect-home", async ({ query, cookie: { auth, refresh }, jwt, status, headers }) => {
        const { pid, redirect_uri } = query;

        const ipAddress = headers['x-forwarded-for'] || null;
        const userAgent = headers['user-agent'] || null;

        const { success, payload, refreshToken, ...res } = await authorizeUser(redirect_uri, ipAddress, userAgent, pid);
        if (!success || !payload || !refreshToken) return status(res.status, { message: res.message, details: res.details })

        const token = await jwt.sign(payload);

        auth.set({
            value: token,
            httpOnly: true,
            maxAge: 15 * 60,
            path: '/',
            sameSite: 'lax',
            secure: true,
        })

        refresh.set({
            value: refreshToken,
            httpOnly: true,
            maxAge: 30 * 24 * 3600,
            path: '/',
            sameSite: 'lax',
            secure: true,
        })

        return status(res.status, {
            redirectUrl: res.redirectUrl
        })
    })

    .post("/refresh", async ({ cookie: { auth, refresh }, jwt, status, headers }) => {
        const ipAddress = headers['x-forwarded-for'] || null;
        const userAgent = headers['user-agent'] || null;
        const irToken = refresh.value as string;

        const { refreshToken, payload, ...res } = await refreshJWT(irToken, ipAddress, userAgent);
        console.log(refreshToken, payload, res);

        if (!refreshToken) return status(res.status, { code: res.code, message: res.message, details: res.details })

        const token = await jwt.sign(payload);

        auth.set({
            value: token,
            httpOnly: true,
            maxAge: 15 * 60,
            path: '/',
            sameSite: 'lax',
            secure: true,
        })

        refresh.set({
            value: refreshToken,
            httpOnly: true,
            maxAge: 30 * 24 * 3600,
            path: '/',
            sameSite: 'lax',
            secure: true,
        })

        return status(res.status, {
            code: res.code,
            token,
            refreshToken,
        })
    }, {
        cookie: t.Cookie({
            refresh: t.String({ error: "Missing: Token `refresh` is required." }),
        })
    })