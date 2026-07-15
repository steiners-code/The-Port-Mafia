import { SERVICE_MAP } from "./lib/SERVICE_MAP";
import { authConfig } from "./lib/auth-config";
import { corsConfig } from "./lib/cor-config";
import bearer from "@elysiajs/bearer";
import { Elysia } from "elysia";

/* index.ts --> api-gateway
  This server acts as an api-gateway between private services and clients
  the server itself is exposed to public network and all requests made from client reaches it.
  From here, the requests are re-routed to their desired locations after passing through certain checks

  ElysiaJS with Bun is used as api-gateway considering its incredible/unrivaled speed.
*/

const app = new Elysia()
  .use(corsConfig) // Cors configuration for accepting only allowed requests
  .use(authConfig)
  .use(bearer())

  // this initializes functions that can be used within the api-gateway for each request.
  .derive(({ set, jwt, cookie: { auth } }) => ({

    // this function takes the bearer token (handled by elysia bearer() middleware) and verify the provided JWT
    // payload containing either `false` or user information is returned.
    // the function then checks wether this user exists or not
    // if users exists, userId is returned. Otherwise a NULL value is returned
    verifyUser: async () => {
      const token = auth.value as string;

      if (!token) return null;

      // Verify using the public key configured in your main jwt plugin
      const payload = await jwt.verify(token);
      if (!payload) return null;

      return payload?.userId;
    },

    // this function re-routes the request to actual backend service.
    // if the target host i.e. service exists in SERVICE_MAP,
    // it returns a fetch request with 'x-user-id' in headers
    // if the host is missing, a 404 Not Found is returned
    proxyTo: async (serviceName: string, subPath: string, req: Request, userId?: string) => {
      const targetHost = SERVICE_MAP[serviceName as keyof typeof SERVICE_MAP];
      if (!targetHost) {
        set.status = 404;
        return { error: 'Service not found' };
      }

      const url = `${targetHost}/${subPath}${new URL(req.url).search}`;
      const proxyHeaders = new Headers(req.headers);

      if (userId) proxyHeaders.set('X-User-Id', userId);

      return fetch(url, {
        method: req.method,
        headers: proxyHeaders,
        body: req.body
      });
    }
  }))

  .group('/api/v1', (app) => app
    // Public Routes - '/auth' routes are made public for authorization/authentication
    .all('/auth/connect-home', async ({ query, cookie: { auth }, ['sign-jwt']: signJwt, status }) => {
      try {
        const { pid, redirect_uri } = query;

        if (process.env.NODE_ENV === "development") {
          const token = await signJwt.sign({
            userId: "sktest-userid-f66369ff0a80430e76c744e71835e08e02b879d845e55b11",
            firstName: "John",
            lastName: "Doe",
            email: "email@example.com",
            refreshed: false
          });

          const defaultDestination = new URL('/linkedin?connection-successful=true', process.env.FRONTEND_URL).toString();
          const clientDestination = redirect_uri ? decodeURIComponent(redirect_uri) : defaultDestination;

          auth.set({
            value: token,
            httpOnly: true,
            maxAge: 7 * 24 * 3600,
            path: '/',
            sameSite: 'lax',
            secure: true,
          })

          return status(200, {
            success: true,
            redirectUrl: clientDestination
          });
        }

        if (!pid) {
          return status(400, { error: 'Bad Request: Missing profile authorization target (pid)' });
        }

        const homeServiceUrl = SERVICE_MAP['home' as keyof typeof SERVICE_MAP];

        const verifyResponse = await fetch(`${homeServiceUrl}/auth/verify-pid?pid=${pid}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (verifyResponse.status !== 200) {
          return status(400, {
            success: false,
            error: 'Unauthorized: The profile identification token is invalid or expired.'
          });
        }

        const userData = await verifyResponse.json();

        const token = await signJwt.sign({
          userId: String(userData.userId),
          firstName: String(userData.firstName),
          lastName: userData.lastName ? String(userData.lastName) : undefined,
          email: String(userData.email),
          refreshed: false
        });

        const defaultDestination = new URL('/linkedin?connection-successful=true', process.env.FRONTEND_URL).toString();
        const clientDestination = redirect_uri ? decodeURIComponent(redirect_uri) : defaultDestination;

        auth.set({
          value: token,
          httpOnly: true,
          maxAge: 7 * 24 * 3600,
          path: '/',
          sameSite: 'lax',
          secure: true,
        })

        return status(200, {
          success: true,
          redirectUrl: clientDestination
        });

      } catch (error) {
        return status(500, {
          success: false,
          error: 'Internal Gateway Error: Handshake validation broke down.',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    })

    // Protected Routes - all the routes targeting a specifc service are protected by-default
    // and required a valid JWT in headers to work. Otherwise '400, Unauthorised' is returned
    .all('/:service/*', async ({ params, request, set, status, proxyTo, verifyUser }) => {
      const userId = await verifyUser();
      if (!userId) {
        set.headers[
          'XXX-Authenticate'
        ] = `Bearer realm=sign error=invalid_request`

        return status(400, "Unauthorised!")
      }

      return proxyTo(params.service, params['*'], request, userId);
    })
  )
  .get('/health', () => "API-GATEWAY is Healthy!")
  .listen(3000);

console.log(`API Gateway is running at ${app.server?.hostname}:${app.server?.port}`);