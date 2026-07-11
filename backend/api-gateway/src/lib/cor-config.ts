import { allowedOrigins } from "./origins";
import cors from "@elysiajs/cors";
import Elysia from "elysia";

// cors-config.ts uses @elysiajs/cors plugin to define
// allowedOrigins as imported from ./origins
// only the requests from these allowed origins
// are processed, rest are ignored... it saves $$$$

export const corsConfig = new Elysia({ name: 'cors-config' })
    .use(cors({
        origin(request) {
            const requestOrigin = request.headers.get('origin');
            if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
                return true;
            }

            return false;
        },
        credentials: true,
    }))