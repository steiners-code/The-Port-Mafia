import { getOrCreateChat } from "../actions/chat/getOrCreateChat";
import { sendChatMessage } from "../actions/chat/sendChatMessage";
import { UserMessageData } from "../lib/types";
import Elysia, { t } from "elysia";

export const chatRoutes = new Elysia({ prefix: '/chat' })
    .get('/message', async ({ headers, status }) => {
        const userId = headers["x-user-id"];

        const { success, ...res } = await getOrCreateChat(userId)
        if (!success || !res.data) return status(res.status, { message: res.message, details: res?.details })

        return status(200, res.data);
    }, {
        headers: t.Object({
            "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
        })
    })

    .post('/send', async ({ headers, body, status }) => {
        const userId = headers["x-user-id"];
        const { contents } = body as UserMessageData;

        const { success, ...res } = await sendChatMessage(userId, contents)

        return status(res.status, { message: res.message, details: res.details })
    }, {
        headers: t.Object({
            "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
        })
    })