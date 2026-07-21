import { createOpaqueRefreshToken } from "../../lib/crypto";
import { verifyFingerprint } from "./verify-signature";
import { prisma } from "../../lib/db";
import { createHash } from "crypto";
import { addDays } from "date-fns";

export async function authorizeUser(pid: string, ipAddress: string | null, userAgent: string | null, redirectUrl?: string) {
    try {
        const defaultDestination = new URL('/main?connection-successful=true', process.env.FRONTEND_URL).toString();
        const clientDestination = redirectUrl ? decodeURIComponent(redirectUrl) : defaultDestination;

        const { success, payload, ...payloadRes } = await getUserPayload(pid);
        if (!success || !payload) return { success, ...payloadRes };

        const session = await prisma.session.create({
            data: {
                userId: payload.userId,
                ipAddress,
                userAgent,
            },
            select: { id: true }
        });

        const { success: tokenSuccess, refreshToken, ...tokenRes } = await getRefreshToken(session.id);
        if (!tokenSuccess || !refreshToken) return { ...tokenRes }

        return {
            status: 200,
            success: true,
            message: "Successfully Authorized 'The Port Mafia' with 'Home'",
            redirectUrl: clientDestination,
            payload,
            refreshToken: refreshToken
        };
    } catch (error) {
        return {
            status: 500,
            success: false,
            error: 'Internal Gateway Error: Handshake validation broke down.',
            details: error instanceof Error ? error.message : String(error)
        }
    }
}

export async function getUserPayload(pid?: string, userId?: string) {
    try {
        let params: string | undefined;

        if (!pid && !userId)
            return {
                status: 400,
                success: false,
                message: 'Bad Request: Missing profile authorization target (pid or userId)'
            }

        if (pid) params = `pid=${pid}`;
        if (userId) params = `userId=${userId}`;
        if (!params)
            return {
                status: 400,
                success: false,
                message: 'Bad Request: Missing profile authorization target (pid or userId)'
            }

        const homeServiceUrl = process.env.HOME_URL;
        if (!homeServiceUrl) return { status: 404, success: false, message: "Server Error: HOME_URL not found." };

        const target = new URL("/api/v1/auth/verify", homeServiceUrl).toString();

        const res = await fetch(`${target}?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            return {
                status: 400,
                success: false,
                message: 'Unauthorized: The profile identification token is invalid or expired.'
            };
        }

        const userData = await res.json();

        const payload = {
            userId: String(userData.userId),
            firstName: String(userData.firstName),
            lastName: userData.lastName ? String(userData.lastName) : undefined,
            email: String(userData.email),
            auth_time: new Date()
        };

        return {
            status: 200,
            success: true,
            message: "Successfully identified user profile.",
            payload,
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: "Server Error: Profile identification failed.",
            details: error instanceof Error ? error.message : String(error)
        };
    }
}

export async function getRefreshToken(sessionId: string) {
    try {
        const { rawToken, hash } = createOpaqueRefreshToken();

        await prisma.refreshToken.create({
            data: {
                hash,
                sessionId,
                expiresAt: addDays(new Date(), 30)
            }
        });

        return {
            success: true,
            status: 200,
            code: 'SUCCESS',
            message: `Created refresh token for session`,
            refreshToken: rawToken,
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            code: 'SERVER_ERROR',
            message: `Server Error: Failed to create refresh token for user ${sessionId}`,
        }
    }
};

export async function refreshJWT(token: string, ipAddress: string | null, userAgent: string | null) {
    try {
        const tokenHash = createHash('sha256').update(token).digest('hex');

        const existingToken = await prisma.refreshToken.findUnique({
            where: { hash: tokenHash },
            select: {
                id: true,
                expiresAt: true,
                isUsed: true,
                sessionId: true,
                session: { select: { ipAddress: true, userAgent: true, userId: true } },
            },
        });

        if (!existingToken)
            return {
                status: 400,
                code: 'SIGN_IN',
                message: "Unauthorized: Invalid Token",
                details: "The refresh token you have provided does not exist."
            }

        if (existingToken.isUsed)
            return {
                status: 400,
                code: 'SIGN_IN',
                message: "Suspicious Activity: Re-Authorize required.",
                details: "The refresh token you have provided has already been used. Re-authorize and monitor your connected devices."
            }

        const session = existingToken.session;

        // Validate user fingerprint or establish the fingerprint only if the fields are present
        // Skip the verification if nothing is present for the UX's sake
        if (ipAddress && userAgent) {
            if (session.ipAddress && session.userAgent) {
                const { valid, reasons, ...res } = await verifyFingerprint(session.userId, existingToken.sessionId, session.ipAddress, session.userAgent, ipAddress, userAgent)
                if (!valid)
                    return { status: 400, ...res, details: JSON.stringify(reasons) }
            };

            await prisma.session.update({
                where: { id: existingToken.sessionId },
                data: { ipAddress, userAgent }
            });
        }

        await prisma.refreshToken.update({
            where: { id: existingToken.id },
            data: { isUsed: true }
        });

        const { rawToken, hash } = createOpaqueRefreshToken();

        await prisma.refreshToken.create({
            data: {
                hash,
                sessionId: existingToken.sessionId,
                expiresAt: existingToken.expiresAt,
            }
        });

        const { success, payload, ...res } = await getUserPayload(session.userId);
        if (!success || !payload) return { code: 'ERROR', ...res, details: "Unable to fetch payload. Please re-authorize with Home." };

        return {
            status: 200,
            code: 'SUCCESS',
            message: "Created refresh token for session",
            refreshToken: rawToken,
            payload,
        }
    } catch (error) {
        return {
            status: 500,
            code: 'SERVER_ERROR',
            message: "Failed to create refresh token for session",
            details: error instanceof Error ? error.message : "Unexpected Server Error!"
        }
    }
}