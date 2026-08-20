import Elysia from "elysia";

export const triggerRoutes = new Elysia({ prefix: '/trigger' })
    .get('/', ({ status }) => {
        return status(200, "ACTIVE")
    })