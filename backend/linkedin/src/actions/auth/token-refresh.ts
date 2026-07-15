import { prisma } from "../../lib/db";
import { differenceInDays } from 'date-fns';
import { decrypt, encrypt } from "../../lib/crypto";
import { calculateExpiryDate } from "../../lib/time";
import { APPSTATUS, LOGLEVEL } from "../../lib/enums";
import { Logs, TypeLinkedinTokens } from "../../lib/types";
import { updateLinkedInStatus } from "../user/update-connection-status";

export async function cronTokenRefresh() {
    let index = 0;
    let refreshedCount = 0;
    let warnedCount = 0;
    let disconnectedCount = 0;
    let failedCount = 0;
    let logs: Logs[] = [];

    const { data: tokensToRefresh, ...tokenRes } = await getTokensToRefresh();
    if (!tokenRes.success || !tokensToRefresh)
        return {
            ...tokenRes,
            data: {
                refreshes_failed: failedCount,
                tokens_refreshed: refreshedCount,
                accounts_disconnected: disconnectedCount,
                users_warned: warnedCount,
                logs,
            }
        }

    for (const token of tokensToRefresh) {
        index++;

        const now = new Date();

        const daysUntilRefresh = differenceInDays(token.access_token_expires_at, now);
        const daysUntilPurge = differenceInDays(token.refresh_token_expires_at, now);

        console.log(daysUntilPurge, daysUntilRefresh);

        if (daysUntilPurge <= 1) {
            const { success, ...res } = await purgreUserTokens(token.userId);

            if (!success) failedCount++;
            else disconnectedCount++;

            logs.push({
                index,
                timestamp: new Date(),
                ...res
            });
            continue;
        } else if (daysUntilPurge <= 7) {
            const res = await warnUserReconnect(token.userId, daysUntilPurge);

            if (!res.success) failedCount++;
            else warnedCount++;

            logs.push({
                index,
                timestamp: new Date(),
                ...res
            });
        } else if (daysUntilPurge <= 30 && (daysUntilPurge - 2) % 7 === 0) {
            const res = await warnUserReconnect(token.userId, daysUntilPurge);

            if (!res.success) failedCount++;
            else warnedCount++;

            logs.push({
                index,
                timestamp: new Date(),
                ...res
            });
        }

        if (daysUntilRefresh <= 30) {
            const { success, ...res } = await refreshUserTokens(token.userId, token.refresh_token);

            if (!success) failedCount++;
            else refreshedCount++;

            logs.push({
                index,
                timestamp: new Date(),
                ...res
            });
            continue;
        };
    };

    return {
        status: 200,
        success: true,
        message: `Cron: Refresh Token: Successfully executed refresh token cron.`,
        data: {
            refreshes_failed: failedCount,
            tokens_refreshed: refreshedCount,
            accounts_disconnected: disconnectedCount,
            users_warned: warnedCount,
            logs,
        }
    };
}

export async function getTokensToRefresh() {
    try {
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const tokensToRefresh = await prisma.linkedinToken.findMany({
            where: {
                OR: [
                    { access_token_expires_at: { lte: thirtyDaysFromNow } },
                    { refresh_token_expires_at: { lte: thirtyDaysFromNow } }
                ]
            }
        });

        if (tokensToRefresh.length === 0)
            return {
                status: 200,
                success: true,
                message: "Cron Success: No tokens require refresh or attention today.",
                data: null
            }

        return {
            status: 200,
            success: true,
            message: `Cron Success: Sucessfully fetched ${tokensToRefresh.length} tokens to refresh.`,
            data: tokensToRefresh
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Cron Failure: Could not fetch expiring tokens from database.",
            data: null
        };
    }
}

export async function purgreUserTokens(userId: string) {
    try {
        await prisma.linkedinToken.delete({
            where: { userId },
        });

        await warnUserReconnect(userId)
        await updateLinkedInStatus(userId, APPSTATUS.DISCONNECTED)

        return {
            status: 200,
            success: true,
            level: LOGLEVEL.INFO,
            message: "Purge Token: Successfully disconnected authorized LinkedIn Account.",
            details: "Removed all tokens for LinkedIn User Account. Reconnection is needed."
        }
    } catch (error: any) {
        return {
            status: 500,
            success: false,
            level: LOGLEVEL.ERROR,
            message: "Purge Token: Failed to disconnect user's LinkedIn Account.",
            details: error?.message ?? "Unexpected Server Error!",
        }
    }
}

export async function warnUserReconnect(userId: string, daysLeft?: number) {
    try {
        // TODO: Notify user about account purge and prompt user to reconnect their account

        return {
            status: 404,
            success: true,
            level: LOGLEVEL.WARN,
            message: "Warn User: Coudn't warn user.",
            details: "Notification service coming soon..."
        }
    } catch (error: any) {
        return {
            status: 500,
            success: false,
            level: LOGLEVEL.ERROR,
            message: "Warn User: Failed to warn user about account disconnection.",
            details: error?.message ?? "Unexpected Server Error!",
        }
    }
}

export async function refreshUserTokens(userId: string, refresh_token: string) {
    try {
        const decryptedRefreshToken = decrypt(refresh_token);

        const params = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: decryptedRefreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        });

        const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!res.ok) {
            let errorDetails = "";

            try {
                const data = await res.json();
                errorDetails = data.error_description;
            } catch (jsonError) {
                errorDetails = "Failed to parse error details from provider."
            }

            return {
                status: res.status,
                success: false,
                level: LOGLEVEL.ERROR,
                message: "Refresh Token: Failed to refresh user tokens.",
                details: errorDetails,
            }
        }

        const tokenData: TypeLinkedinTokens = await res.json()

        const encrypted_access_token = encrypt(tokenData.access_token);
        const encrypted_refresh_token = encrypt(tokenData.refresh_token);

        const access_token_expires_at = calculateExpiryDate(tokenData.expires_in);
        const refresh_token_expires_at = calculateExpiryDate(tokenData.refresh_token_expires_in);

        await prisma.linkedinToken.update({
            where: { userId },
            data: {
                access_token: encrypted_access_token,
                access_token_expires_at,
                refresh_token: encrypted_refresh_token,
                refresh_token_expires_at,
            },
        });

        return {
            status: 200,
            success: true,
            level: LOGLEVEL.INFO,
            message: "Refresh Token: Successfully refreshed user LinkedIn Account tokens.",
            details: "Refreshed access_token, refresh_token and new expiration dates.",
        }
    }
    catch (error: any) {
        return {
            status: 500,
            success: false,
            level: LOGLEVEL.ERROR,
            message: "Refresh Token: Failed to refresh user tokens.",
            details: error?.message ?? "Unexpected Server Error!",
        }
    }
}