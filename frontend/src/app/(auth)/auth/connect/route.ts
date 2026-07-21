import { authorizeConnection } from "@/actions/authorize-with-home";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const pid = searchParams.get("pid");
    const redirectTo = searchParams.get("redirectTo") ?? undefined;

    if (!pid) {
        return new NextResponse("Missing PID parameter", { status: 400 });
    }

    const { success, message, redirectUrl } = await authorizeConnection(pid, redirectTo);

    if (!success || !redirectUrl) {
        return new NextResponse(`Authentication Failed: ${message}`, { status: 400 });
    }

    return NextResponse.redirect(redirectUrl);
}