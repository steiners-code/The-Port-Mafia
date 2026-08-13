import { Elysia } from "elysia";
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/auth";
import { cronRoutes } from "./routes/cron";
import { chatRoutes } from "./routes/chat";
import { blobRoutes } from "./routes/blob";

const app = new Elysia()
  .use(authRoutes)
  .use(userRoutes)
  .use(cronRoutes)
  .use(chatRoutes)
  .use(blobRoutes)
  .get("/health", () => "Main Service is Healthy!")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
