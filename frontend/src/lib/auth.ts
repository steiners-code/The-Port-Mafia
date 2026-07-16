"use server"

import { NextRequest, NextResponse } from "next/server";
import { getLoginUrl, getUrl } from "./utils";
import { jwtVerify, importSPKI } from "jose";
import { cookies } from "next/headers";
import dotenv from "dotenv";

dotenv.config();

interface AuthPayload {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
}

// -------------------------------- LOAD PUBLIC KEY -----------------------------------

const PUBLIC_KEY_PEM = process.env.JWT_PUBLIC_KEY!;

let cachedPublicKey: any = null;

async function getPublicKey() {
    if (cachedPublicKey) return cachedPublicKey;

    const pem = PUBLIC_KEY_PEM.replace(/\\n/g, "\n");
    cachedPublicKey = await importSPKI(pem, "RS256");
    return cachedPublicKey;
}

export async function verifyJWT(token: string): Promise<AuthPayload | null> {
    try {
        const publicKey = await getPublicKey();
        const { payload } = await jwtVerify(token, publicKey, { algorithms: ["RS256"] });
        return payload as unknown as AuthPayload;
    } catch (error) {
        return null;
    }
}

export async function auth(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = request.cookies.get("auth")?.value;
    const refreshToken = request.cookies.get("refresh")?.value;

    let payload = token ? await verifyJWT(token) : null;

    if (payload) {
        const response = NextResponse.next();
        response.headers.set("x-user-id", payload.userId);

        return response;
    }

    if (!refreshToken) {
        return NextResponse.redirect(getLoginUrl(pathname));
    }

    try {
        const res = await fetch(getUrl('/auth/refresh'), {
            method: "POST",
            headers: {
                "Cookie": `refresh=${refreshToken}`,
                "cf-connecting-ip": request.headers.get("cf-connecting-ip") || "",
                "x-forwarded-for": request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
                "user-agent": request.headers.get("user-agent") || "",
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();

        if (data.code === "SIGN_IN") {
            // Token is dead, hijacked, or invalid. Force re-login.
            return NextResponse.redirect(getLoginUrl(pathname));
        }

        if (data.code === "SERVER_ERROR") {
            // Something broke on the backend
            const errorUrl = new URL("/error", request.url);
            errorUrl.searchParams.set("message", data.message || "Authentication failure");
            errorUrl.searchParams.set("details", data.details || "Gateway rejected refresh request");
            errorUrl.searchParams.set("from", pathname);
            errorUrl.searchParams.set("to", getLoginUrl(pathname));
            return NextResponse.redirect(errorUrl);
        }

        if (data.code === "SUCCESS") {
            payload = await verifyJWT(data.auth);

            const response = NextResponse.next();

            response.cookies.set({
                name: "auth",
                value: data.token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 15 * 60
            });

            response.cookies.set({
                name: "refresh",
                value: data.refreshToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60
            });

            if (payload) {
                response.headers.set("x-user-id", payload.userId);
            }

            return response;
        }

        // Fallback catch-all if the server returns weird data
        return NextResponse.redirect(getLoginUrl(pathname));

    } catch (error) {
        // Network failure (Gateway is offline / unreachable)
        const errorUrl = new URL("/error", request.url);
        errorUrl.searchParams.set("message", "Network Error");
        errorUrl.searchParams.set("details", "Could not reach the authentication server.");
        errorUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(errorUrl);
    }
}

export async function deleteJWT() {
    const cookieStore = await cookies();
    cookieStore.delete("auth");
}