"use server";

import { cookies } from 'next/headers';
import { getUrl } from '@/lib/utils';
import { api } from '@/lib/api';

type Return = {
    success: boolean,
    message: string,
    details?: string,
    redirectUrl?: string
}

export async function authorizeConnection(pid: string, redirectTo?: string): Promise<Return> {
    try {
        const cookieStore = await cookies();

        const res = await api.post(getUrl(`/auth/connect-home?pid=${pid}&redirect_uri=${redirectTo}`));
        const data = res.data

        cookieStore.set({
            name: "auth",
            value: data.auth,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 15 * 60,
            path: "/",
        });

        cookieStore.set({
            name: "refresh",
            value: data.refreshToken,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
        });

        const target = new URL(data.redirectUrl, process.env.NEXT_PUBLIC_FRONTEND_URL!).toString();

        return { success: true, message: data.message, redirectUrl: target };
    } catch (error) {
        console.log(error)
        return { success: false, message: "Something went wrong!", details: error instanceof Error ? error.message : "Unexpected Error" }
    }
}