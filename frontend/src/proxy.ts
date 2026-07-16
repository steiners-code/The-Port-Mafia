import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

// -------------------------------- HELPER FUNCTION -----------------------------------

const publicRoutes = ["/", "/auth/connect-home"];

// -------------------------------- PROXY (MIDDLEWARE) -----------------------------------

// This is the proxy (middleware) function. 
// It will check the route and get payload from signed JWT
// from cookies checks the validity and the route.
// if JWT is valid with auth route ---> Go to dashboard brother
// if nothing above then proceed.
// it sets `x-user-id` in headers so other pages can get it whenever they want to.

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isPublicRoute) {
        return auth(request);
    }

    return NextResponse.next();
}

// -------------------------------- ROUTE MATCHER -----------------------------------

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};