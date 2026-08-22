import { updatePostPerformanceBody, updatePostPerformanceTask } from '../actions/tasks/updatePostPerformanceTask';
import { updateQuestionnaireBody, updateQuestionnaireTask } from '../actions/tasks/updateQuestionnaireTask';
import { updateAccountSnapshotBody, updateAccountSnapshotTask } from '../actions/tasks/updateAccountSnapshotTask';
import { createTask, createTaskBody } from '../actions/tasks/createTask';
import { getMainTasks } from '../actions/tasks/getMainTasks';
import { getTaskById } from '../actions/tasks/getTaskById';
import Elysia, { t } from 'elysia';

const userId = t.Object({
    "x-user-id": t.String({ error: "Missing API-Gateway ID: userId" })
})

const taskId = t.Object({
    "id": t.String({ error: "Missing Requested Task ID: id" })
})

const filters = t.Object({
    filters: t.Object({})
})

export const taskRoutes = new Elysia({ prefix: '/tasks' })
    .get('/', async ({ status, headers, query }) => {
        const userId = headers['x-user-id']
        const filters = query.filters

        const { success, data, ...res } = await getMainTasks(userId, filters)
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data)
    }, {
        headers: userId,
        query: t.Optional(filters)
    })

    .get('/get', async ({ status, headers, query }) => {
        const userId = headers['x-user-id']
        const taskId = query.id

        const { success, data, ...res } = await getTaskById(userId, taskId)
        if (!success || !data) return status(res.status, { message: res.message, details: res.details })

        return status(200, data)
    }, {
        headers: userId,
        query: taskId
    })

    .post('/create', async ({ headers, status, body }) => {
        const userId = headers["x-user-id"]

        if (!body) return status(400, "Bad Request: Missing task requirements.")

        const { success, ...res } = await createTask(userId, body);
        if (!success) return status(res.status, { message: res.message, details: res.details })

        return status(200, { message: res.message })
    }, {
        headers: userId,
        body: createTaskBody,
    })

    .post('/update/questionnaire', async ({ headers, status, body }) => {
        const userId = headers['x-user-id']

        const res = await updateQuestionnaireTask(userId, body)
        if (!res.success) return status(res.status, { message: res.message })

        return status(200, { message: res.message })
    }, {
        headers: userId,
        body: updateQuestionnaireBody,
    })

    .post('/update/post-performance', async ({ headers, status, body }) => {
        const userId = headers['x-user-id']

        const res = await updatePostPerformanceTask(userId, body)
        if (!res.success) return status(res.status, { message: res.message })

        return status(200, { message: res.message })
    }, {
        headers: userId,
        body: updatePostPerformanceBody,
    })

    .post('/update/account-snapshot', async ({ headers, status, body }) => {
        const userId = headers['x-user-id']

        const res = await updateAccountSnapshotTask(userId, body)
        if (!res.success) return status(res.status, { message: res.message })

        return status(200, { message: res.message })
    }, {
        headers: userId,
        body: updateAccountSnapshotBody,
    })