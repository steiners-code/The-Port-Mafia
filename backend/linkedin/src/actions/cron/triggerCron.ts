import { cronWorkflowTrigger } from "./cronWorkflowTrigger";
import { cronTokenRefresh } from "../auth/token-refresh";

export async function triggerCron() {
    const tokenRefreshRes = await cronTokenRefresh();
    const workflowTriggerRes = await cronWorkflowTrigger()

    return { tokenRefreshRes, workflowTriggerRes };
}