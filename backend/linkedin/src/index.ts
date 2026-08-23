import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";
import { cronRoutes } from "./routes/cron";
import { chatRoutes } from "./routes/chat";
import { internalRoutes } from "./routes/internal";
import { postRoutes } from "./routes/post";

const app = new Elysia()
  .use(authRoutes)
  .use(cronRoutes)
  .use(chatRoutes)
  .use(internalRoutes)
  .use(postRoutes)
  .get("/health", () => "LinkedIn service is Healthy!")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
