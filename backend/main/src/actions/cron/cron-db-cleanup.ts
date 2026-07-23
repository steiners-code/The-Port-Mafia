import { LOGLEVEL } from "../../lib/enums";
import { Logs } from "../../lib/types";
import { prisma } from "../../lib/db";

export async function cronDBCleanup() {
    let index = 0;
    let logs: Logs[] = [];

    const sessionRes = await purgeRevokedSessions();
    index++;
    logs.push({ index, timestamp: new Date(), ...sessionRes });

    const tokenRes = await purgeDeadRefreshTokens();
    index++;
    logs.push({ index, timestamp: new Date(), ...tokenRes });

    const success = sessionRes.success && tokenRes.success;

    return {
        status: success ? 200 : 500,
        success,
        message: success
            ? "Cron: DB Cleanup: Successfully executed cleanup cron."
            : "Cron: DB Cleanup: Completed with one or more failures.",
        data: {
            sessions_deleted: sessionRes.count ?? 0,
            refresh_tokens_deleted: tokenRes.count ?? 0,
            logs,
        },
    };
}

/**
 * Deletes sessions marked isRevoked. RefreshToken rows cascade-delete
 * automatically via the schema's onDelete: Cascade — no need to touch
 * RefreshToken here.
 */
export async function purgeRevokedSessions() {
    try {
        const { count } = await prisma.session.deleteMany({
            where: { isRevoked: true },
        });

        return {
            success: true,
            status: 200,
            count,
            level: LOGLEVEL.INFO,
            message: "DB Cleanup: Successfully purged revoked sessions.",
            details: `Deleted ${count} revoked session row(s), cascading their refresh tokens.`,
        };
    } catch (error: any) {
        return {
            success: false,
            status: 500,
            count: 0,
            level: LOGLEVEL.ERROR,
            message: "DB Cleanup: Failed to purge revoked sessions.",
            details: error?.message ?? "Unexpected Server Error!",
        };
    }
}

/**
 * Deletes refresh tokens that are dead on their own terms — expired past
 * their expiresAt, or already consumed (isUsed) — independent of whether
 * their parent session was revoked. Covers tokens left behind under a
 * still-active session (normal refresh rotation) so they don't pile up.
 */
export async function purgeDeadRefreshTokens() {
    try {
        const { count } = await prisma.refreshToken.deleteMany({
            where: {
                OR: [{ expiresAt: { lte: new Date() } }, { isUsed: true }],
            },
        });

        return {
            success: true,
            status: 200,
            count,
            level: LOGLEVEL.INFO,
            message: "DB Cleanup: Successfully purged dead refresh tokens.",
            details: `Deleted ${count} expired or used refresh token row(s).`,
        };
    } catch (error: any) {
        return {
            success: false,
            status: 500,
            count: 0,
            level: LOGLEVEL.ERROR,
            message: "DB Cleanup: Failed to purge dead refresh tokens.",
            details: error?.message ?? "Unexpected Server Error!",
        };
    }
}