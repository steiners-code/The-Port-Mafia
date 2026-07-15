import { api, getUrl } from '@/lib/utils';

const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL!;
const NODE_ENV = process.env.NODE_ENV!;

export async function authorizeConnection() {
    try {

        // TODO: This is the bypass till home server is activated... make sure to remove this later.
        // This will originally redirect user to home from where user is redirected to this url
        // a pid will be taken from the url... if there's an error message then that is displayed instead.
        // getting pid, a request is made to server which communicates with the home server to get user credentials
        // after verification, server returns a response with cookies set for jwt
        // if (NODE_ENV === "development") {
        const res = await api.post(getUrl("/auth/connect-home"));

        if (res.status !== 200) {
            return { success: false, message: res.data.error || "An unexpected error occurred!", redirectUrl: "" }
        }

        const redirectUrl = res.data.redirectUrl;
        return { success: true, message: "", redirectUrl: redirectUrl };
        // }

        const url = new URL("/auth/connect?app=the-port-mafia", HOME_URL).toString();

        return { success: true, message: "", redirectUrl: url };
    } catch (error) {
        return { success: false, message: "An unexpected error occurred!", redirectUrl: "" }
    }
}