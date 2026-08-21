import { resumeAnalyst, resumeStrategist, resumeObserver, resumeWriter } from "../actions/resume/handleResumeTrigger";
import Elysia, { t } from "elysia";

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
});

const resumeBody = t.Object({
    contentId: t.String({ minLength: 1 }),
    messageId: t.String({ minLength: 1 }),
});

export const triggerRoutes = new Elysia({ prefix: '/trigger' })
    .post('/analyst', async ({ status, headers, body }) => {
        const result = await resumeAnalyst(headers["x-user-id"], body.contentId, body.messageId);
        return status(result.status, result);
    }, {
        headers: userId,
        body: resumeBody
    })
    .post('/strategist', async ({ status, headers, body }) => {
        const result = await resumeStrategist(headers["x-user-id"], body.contentId);
        return status(result.status, result);
    }, {
        headers: userId,
        body: resumeBody
    })
    .post('/observer', async ({ status, headers, body }) => {
        const result = await resumeObserver(headers["x-user-id"], body.contentId);
        return status(result.status, result);
    }, {
        headers: userId,
        body: resumeBody
    })
    .post('/writer', async ({ status, headers, body }) => {
        const result = await resumeWriter(headers["x-user-id"], body.contentId);
        return status(result.status, result);
    }, {
        headers: userId,
        body: resumeBody
    })