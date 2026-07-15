import { Elysia } from "elysia";
import { userRoutes } from "./routes/user";

const app = new Elysia()
  .use(userRoutes)
  .get("/health", () => "Main Service is Healthy!")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
