import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { cronRoutes } from "./routes/cron";

const app = new Elysia()
  .use(authRoutes)
  .use(cronRoutes)
  .get("/health", () => "LinkedIn service is Healthy!")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
