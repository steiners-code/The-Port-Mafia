import { APPSTATUS, APPTYPE, LOGLEVEL } from "../../lib/enums";

export async function updateLinkedInStatus(userId: string, status: APPSTATUS) {
    try {
        const res = await fetch("http://mafia-main:3000/user/connect-app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": userId
            },
            body: JSON.stringify({
                app: APPTYPE.LINKEDIN,
                status,
            })
        })

        console.log(res);

        if (!res.ok)
            return {
                status: res.status,
                success: false,
                level: LOGLEVEL.ERROR,
                message: "App Connection: Network Error.",
                details: `Unexpected Error occurred while updating ${APPTYPE.LINKEDIN} status to ${status}`
            }

        return {
            status: 200,
            success: true,
            level: LOGLEVEL.INFO,
            message: `App Connection: Successfully ${status} ${APPTYPE.LINKEDIN}`,
        }
    } catch (error) {
        console.error(error);
        return {
            status: 200,
            success: true,
            level: LOGLEVEL.ERROR,
            message: "App Connection: Unexpected Server Error!",
        }
    }
}