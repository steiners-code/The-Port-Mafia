import { APPSTATUS, APPTYPE } from "../../generated/prisma";
import { prisma } from "../../lib/db";

export async function userAppConnection(app: APPTYPE, status: APPSTATUS, userId: string) {
    try {
        await prisma.connectedApps.upsert({
            where: { userId_app: { userId, app } },
            create: { userId, app, status },
            update: { status }
        })

        return {
            status: 200,
            message: `${app} status successfully updated to ${status}`
        }
    } catch (error) {
        return {
            status: 500,
            message: `Server Error: Failed to update ${app} status to ${status}`
        }
    }
}

export async function getUserConnectedApps(userId: string) {
    try {
        const connectedApps = await prisma.connectedApps.findMany({
            where: { userId },
            select: {
                app: true,
                status: true,
            }
        });

        const connectedMap = Object.fromEntries(
            connectedApps.map(({ app, status }) => [app, status])
        );

        const appStatusMap = Object.fromEntries(
            Object.values(APPTYPE).map((app) => [
                app,
                connectedMap[app] ?? APPSTATUS.DISCONNECTED
            ])
        ) as Record<APPTYPE, APPSTATUS>;

        return {
            status: 200,
            message: "Successfully retrieved connected apps.",
            data: appStatusMap
        }
    } catch (error) {
        return {
            status: 500,
            message: "Unexpected Server Error!",
            data: null
        }
    }
}