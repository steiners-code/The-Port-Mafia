/**
 * Same-origin SSE proxy for mafia.markaz.network. Forwards the session
 * cookie to the internal gateway as a request header (server-to-server,
 * so no cross-origin cookie/CORS constraints apply) and pipes the
 * upstream event stream straight back to the browser unbuffered.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AGENT_BACKEND_ROUTES: Record<string, string> = {
    main: "/main",
    linkedin: "/linkedin",
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://api-gateway:3000";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ agent: string }> }
) {
    const { agent } = await params;
    const backendRoute = AGENT_BACKEND_ROUTES[agent];

    if (!backendRoute) {
        return new Response("Unknown agent", { status: 404 });
    }

    const cookie = req.headers.get("cookie");
    if (!cookie) {
        return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(`/api/v1${backendRoute}/chat/sse`, SERVER_URL).toString();
    const upstream = await fetch(url, {
        headers: { cookie, accept: "text/event-stream" },
    });

    console.log(url);
    console.log(JSON.stringify(upstream, null, 4))

    if (!upstream.ok || !upstream.body) {
        return new Response("Upstream connection failed", {
            status: upstream.status || 502,
        });
    }

    const headers = new Headers(upstream.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.set("cache-control", "no-cache, no-transform");

    return new Response(upstream.body, { status: upstream.status, headers });
}