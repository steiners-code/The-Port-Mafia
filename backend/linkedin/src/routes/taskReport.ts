import { handlePostPerformanceReport } from "../actions/task/handlePostPerformanceReport";
import { handleAccountSnapshotReport } from "../actions/task/handleAccountSnapshotReport";
import { handleStrategistTaskReport } from "../actions/task/handleStrategistTaskReport";
import { handleObserverTaskReport } from "../actions/task/handleObserverTaskReport";
import Elysia, { t } from "elysia";

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
});

const questionnaireBody = t.Array(
    t.Object({
        index: t.Number(),
        question: t.String({ minLength: 1 }),
        answer: t.Nullable(t.String()),
        answeredBy: t.Nullable(t.Union([t.Literal("USER"), t.Literal("DAZAI")])),
    }),
    { minItems: 1 }
);

const postPerformanceBody = t.Object({
    type: t.Literal("POST_PERFORMANCE"),
    content: t.Array(t.Object({
        postId: t.String({ minLength: 1 }),
        reactions: t.Number(),
        comments: t.Number(),
        reposts: t.Number(),
        impressions: t.Optional(t.Number()),
    }),)
});

const accountSnapshotBody = t.Object({
    type: t.Literal("ACCOUNT_SNAPSHOT"),
    content: t.Object({
        connectionsTotal: t.Number(),
        followersTotal: t.Number(),
        date: t.String({ minLength: 1 }),
    })
});

const handlerBody = t.Union([postPerformanceBody, accountSnapshotBody])

export const taskReportRoutes = new Elysia({ prefix: '/task-report' })
    .post('/strategist', async ({ status, headers, body }) => {
        const result = await handleStrategistTaskReport(headers["x-user-id"], body);
        return status(result.status, result);
    }, {
        headers: userId,
        body: questionnaireBody
    })

    .post('/observer', async ({ status, headers, body }) => {
        const result = await handleObserverTaskReport(headers["x-user-id"], body);
        return status(result.status, result);
    }, {
        headers: userId,
        body: questionnaireBody
    })

    .post('/handler', async ({ status, headers, body }) => {
        const userId = headers["x-user-id"];
        let result: { status: number, message: string, details?: string, success: boolean } = {
            success: false,
            status: 404,
            message: `The provided type \'${body.type!}\' is invalid.`,
            details: "Unable to accept request. Invalid type."
        };

        if (body.type === "POST_PERFORMANCE")
            result = await handlePostPerformanceReport(userId, body.content);
        else if (body.type === "ACCOUNT_SNAPSHOT")
            result = await handleAccountSnapshotReport(userId, body.content);

        return status(result.status, result);
    }, {
        headers: userId,
        body: handlerBody
    })
