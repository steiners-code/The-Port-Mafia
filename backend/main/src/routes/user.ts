import Elysia, { t } from "elysia";
import { APPSTATUS, APPTYPE } from "../generated/prisma";
import { getUserConnectedApps, userAppConnection } from "../actions/user/app-connetion";

export const userRoutes = new Elysia({ prefix: '/user' })
    .post("/connect-app", async ({ body, headers, status }) => {
        const userId = headers['x-user-id'];

        const { app: appName, status: connectionStatus } = body as { app: APPTYPE, status: APPSTATUS }

        if (!appName || !connectionStatus)
            return status(400, { message: "Missing or invalid fields: app or status.", appName, connectionStatus });

        const res = await userAppConnection(appName, connectionStatus, userId);

        return status(res.status, res.message);
    }, {
        headers: t.Object({
            'x-user-id': t.String({ error: "Unauthorized: Missing API Gateway User ID" })
        })
    })

    .get("/connected-apps", async ({ status, headers }) => {
        const userId = headers['x-user-id'];

        const res = await getUserConnectedApps(userId)

        return status(res.status, { message: res.message, data: res.data });
    }, {
        headers: t.Object({
            'x-user-id': t.String({ error: "Unauthorized: Missing API Gateway User ID" })
        })
    })