import { handleStrategistTaskReport } from "../actions/chat/strategist/handleStrategistTaskReport";
import { handleObserverTaskReport } from "../actions/chat/observer/handleObserverTaskReport";
import Elysia, { t } from "elysia";

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
});

const questionnaireBody = t.Object({
    title: t.String({ minLength: 1 }),
    type: t.Literal("QUESTIONNAIRE"),
    content: t.Array(
        t.Object({
            index: t.Number(),
            question: t.String({ minLength: 1 }),
            answer: t.Nullable(t.String()),
            answeredBy: t.Nullable(t.Union([t.Literal("USER"), t.Literal("DAZAI")])),
        }),
        { minItems: 1 }
    ),
});

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