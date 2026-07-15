import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth";

const app = new Elysia()
  .use(authRoutes)
  .get("/health", () => "LinkedIn service is Healthy!")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
