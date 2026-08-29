import { prisma } from "../../lib/db";

type AccountSnapshotBody = {
    connectionsTotal: number;
    followersTotal: number;
    date: string;
};

type ActionResult = {
    success: boolean;
    status: number;
    message: string;
    details?: string;
};

/**
 * Pure ingestion, same reasoning as handlePostPerformanceReport — MAIN
 * owns the Sunday-only scheduling and the XLSX-row resolution against
 * current time (FUTURE_DECISIONS.md §5). No AI call, no timezone or
 * scheduling logic here; this route only ever writes what it's handed.
 */
export async function handleAccountSnapshotReport(userId: string, body: AccountSnapshotBody): Promise<ActionResult> {
    try {
        const date = new Date(body.date);
        if (Number.isNaN(date.getTime())) {
            return {
                success: false,
                status: 400,
                message: "Invalid date provided for account snapshot.",
                details: `date="${body.date}" is not a valid date.`,
            };
        }

        await prisma.linkedinAccountSnapshot.upsert({
            where: { userId_date: { userId, date } },
            create: {
                userId,
                date,
                connectionsTotal: body.connectionsTotal,
                followersTotal: body.followersTotal,
            },
            update: {
                connectionsTotal: body.connectionsTotal,
                followersTotal: body.followersTotal,
            },
        });

        return {
            success: true,
            status: 200,
            message: "Account snapshot recorded.",
        };
    } catch (error) {
        return {
            success: false,
            status: 500,
            message: "Unable to record account snapshot.",
            details: error instanceof Error ? error.message : "Internal Server Error!",
        };
    }
}