import { getMainTasks } from '../actions/task/getMainTasks';
import { createTask } from '../actions/task/createTask';
import { CreateTaskBody } from '../lib/types';
import Elysia, { t } from 'elysia';

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
})

const filters = t.Object({
    filters: t.Object({})
})

const mahaLinkedInTaskBody = t.Object({
    title: t.String({ minLength: 1 }),
    type: t.Literal("QUESTIONNAIRE"),
    subAgent: t.Literal("MAHA"),
    subAgentPlatform: t.Literal("LINKEDIN"),
    subAgentRole: t.Union([
        t.Literal("OBSERVER"),
        t.Literal("ANALYST"),
        t.Literal("STRATEGIST"),
        t.Literal("WRITER"),
        t.Literal("HANDLER"),
    ]),
    questions: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
});

const createTaskBody = t.Union([mahaLinkedInTaskBody]);

export const taskRoutes = new Elysia({ prefix: '/tasks' })
    .get('/get', async ({ status, headers, query }) => {
        const userId = headers['x-user-id']
        const filters = query.filters

        const { success, data, ...res } = await getMainTasks(userId, filters)
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data)
    }, {
        headers: userId,
        query: t.Optional(filters)
    })

    .post('/create', async ({ headers, status, body }) => {
        const userId = headers["x-user-id"]
        const data = body as CreateTaskBody;

        if (!data) return status(400, "Bad Request: Missing task requirements.")

        const { success, ...res } = await createTask(userId, data);
        if (!success) return status(res.status, { message: res.message, details: res.details })

        return status(200, res.message)
    }, {
        headers: userId,
        body: createTaskBody,
    })