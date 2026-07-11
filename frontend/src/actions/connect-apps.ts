// import 'dotenv';
import { redirect } from "next/navigation";

export const initiateLinkedInAuth = () => {
    const rootUrl = "https://www.linkedin.com/oauth/v2/authorization";
    const client_id = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;

    if (!client_id) {
        throw new Error("Something went wrong!")
    }

    const options = {
        response_type: "code",
        client_id,
        redirect_uri: "http://localhost:3810/api/auth/callback",
        state: "random_secure_string_or_csrf_token",
        scope: "openid profile w_member_social r_profile_basicinfo",
    };

    const qs = new URLSearchParams(options).toString();

    redirect(`${rootUrl}?${qs}`);
};