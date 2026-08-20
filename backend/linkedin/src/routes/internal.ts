import { taskReportRoutes } from "./taskReport";
import { triggerRoutes } from "./trigger";
import Elysia from "elysia";

export const internalRoutes = new Elysia({ prefix: '/internal' })
    .use(taskReportRoutes)
    .use(triggerRoutes)