import { prisma } from "../../lib/db";
import { encrypt } from "../../lib/crypto";
import { calculateExpiryDate } from "../../lib/time";
import { TypeLinkedinTokens } from "../../lib/types";

export async function tokenExchange(code: string, redirect_uri: string, userId: string) {
    const { data: tokenData, ...tokenRes } = await getLinkedinTokens(code, redirect_uri);
    if (!tokenRes.success || !tokenData) return tokenRes;

    const { data: profileData, ...profileRes } = await getLinkedinProfile(tokenData.access_token)
    if (!profileRes.success || !profileData) return profileRes;

    try {
        await prisma.linkedinProfile.upsert({
            where: {
                userId: userId,
            },
            update: {
                given_name: profileData.given_name,
                family_name: profileData.family_name,
                picture: profileData.picture,
                email: profileData.email,
                email_verified: profileData.email_verified,
                locale_country: profileData.locale.country,
                locale_language: profileData.locale.language,
            },
            create: {
                userId,
                sub: profileData.sub,
                given_name: profileData.given_name,
                family_name: profileData.family_name,
                picture: profileData.picture,
                email: profileData.email,
                email_verified: profileData.email_verified,
                locale_country: profileData.locale.country,
                locale_language: profileData.locale.language,
            }
        });
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Could not save or sync user's LinkedIn profile data.",
        }
    };

    try {
        const encrypted_access_token = encrypt(tokenData.access_token);
        const encrypted_refresh_token = encrypt(tokenData.refresh_token);

        const access_token_expires_at = calculateExpiryDate(tokenData.expires_in);
        const refresh_token_expires_at = calculateExpiryDate(tokenData.refresh_token_expires_in);

        await prisma.linkedinToken.upsert({
            where: { userId },
            update: {
                access_token: encrypted_access_token,
                access_token_expires_at,
                refresh_token: encrypted_refresh_token,
                refresh_token_expires_at,
                scope: tokenData.scope,
            },
            create: {
                userId,
                access_token: encrypted_access_token,
                access_token_expires_at,
                refresh_token: encrypted_refresh_token,
                refresh_token_expires_at,
                scope: tokenData.scope,
            }
        });
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Could not save user's LinkedIn tokens in database.",
        }
    }

    return {
        success: true,
        status: 200,
        message: "Successfully befriended LinkedIn!"
    }
}

export async function getLinkedinTokens(code: string, redirectUri: string) {
    try {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            redirect_uri: redirectUri,
        });

        const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!res.ok)
            return {
                status: 400,
                success: false,
                message: "Failed to verify LinkedIn Account.",
                data: null
            };

        const data: TypeLinkedinTokens = await res.json();

        return {
            status: 200,
            success: true,
            message: "Successfully verified LinkedIn Account.",
            data
        };
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Unexpected Server Error!",
            data: null
        };
    }
}

type TypeLinkedinProfile = null | {
    sub: string,
    email_verified: boolean,
    name: string,
    locale: {
        country: string,
        language: string
    },
    given_name: string,
    family_name: string,
    email: string,
    picture: string,
}

export async function getLinkedinProfile(accessToken: string) {
    try {
        const res = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok)
            return {
                status: 400,
                success: false,
                message: "Faield to fetch LinkedIn Profile",
                data: null
            };

        const data: TypeLinkedinProfile = await res.json();

        return {
            status: 200,
            success: true,
            message: "LinkedIn connected successfully!",
            data
        };
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Unexpected Server Error!",
            data: null
        };
    }
}