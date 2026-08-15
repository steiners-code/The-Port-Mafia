import { getOrCreateChat } from "../actions/chat/getOrCreateChat";
import { sendChatMessage } from "../actions/chat/sendChatMessage";
import { getMessageLogs } from "../actions/chat/getMessageLogs";
import { getFileContent } from "../actions/file/getFileContent";
import { sseHandler } from "../actions/chat/sseHandler";
import { UserMessageData } from "../lib/types";
import Elysia, { t } from "elysia";

export const chatRoutes = new Elysia({ prefix: '/chat' })
    .get('/message', async ({ query, headers, status }) => {
        const userId = headers["x-user-id"];
        const createdAt = query["createdAt"]
        const id = query["id"]
        const cursor = id && createdAt ? { createdAt, id } : undefined

        const { success, ...res } = await getOrCreateChat(userId, cursor)
        if (!success || !res.data) return status(res.status, { message: res.message, details: res?.details })

        return status(200, res.data);
    }, {
        headers: t.Object({
            "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
        }),
        query: t.Object({
            createdAt: t.Optional(t.Date()),
            id: t.Optional(t.String())
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

    .get('/logs', async ({ query, status }) => {
        const { messageId } = query;
        const { success, data, ...res } = await getMessageLogs(messageId);
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data)
    }, {
        query: t.Object({
            messageId: t.String({ error: "Missing Query Field: messageId is required" })
        })
    })

    .get('/file', async ({ query, headers, status }) => {
        const userId = headers["x-user-id"];
        const { fileType } = query;
        const { success, data, ...res } = await getFileContent(userId, fileType);
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data)
    }, {
        headers: t.Object({
            "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
        }),
        query: t.Object({
            "fileType": t.Enum({ USER: "USER", MEMORY: "EXPERIENCE" })
        })
    })

    .get("/sse", () => sseHandler());