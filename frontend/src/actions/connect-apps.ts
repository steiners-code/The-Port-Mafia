import { redirect } from "next/navigation";
import { api, getUrl } from '@/lib/utils';

export const initiateLinkedInAuth = () => {
    const rootUrl = "https://www.linkedin.com/oauth/v2/authorization";
    const client_id = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;

    if (!client_id) {
        throw new Error("Something went wrong!")
    }

    const redirectUri = encodeURIComponent(getUrl("/linkedin/callback", "frontend"));
    const state = "random_secure_string_or_csrf_token";
    const scope = "openid profile email";

    const authUrl = `${rootUrl}?response_type=code&client_id=${client_id}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    redirect(authUrl);
};

type ExchangeResult = {
    success: boolean;
    message: string;
    redirectUrl: string;
};

/**
 * Trades the one-time LinkedIn authorization code for a live connection.
 * Always resolves — never throws — so the caller only has to branch on
 * `success`, matching the pattern in actions/authorize-with-home.ts.
 */
export async function exchangeLinkedInCode(code: string): Promise<ExchangeResult> {
    try {
        const redirect_uri = getUrl("/linkedin/callback", "frontend");

        const res = await api.post(getUrl("/linkedin/auth/exchange"), { code, redirect_uri });

        if (res.status !== 200) {
            return {
                success: false,
                message: res.data?.message ?? "LinkedIn didn't confirm the connection.",
                redirectUrl: "",
            };
        }

        return {
            success: true,
            message: "",
            redirectUrl: res.data?.redirectUrl ?? "/linkedin",
        };
    } catch (error) {
        return {
            success: false,
            message: "An unexpected error occurred!",
            redirectUrl: "",
        };
    }
}