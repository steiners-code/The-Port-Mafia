import { AccountSnapshot, AccountSnapshotTaskBody } from "../../lib/types";

export function createAccountSnapshotTask(data: AccountSnapshotTaskBody["content"]): AccountSnapshot {
    return {
        ...data,
        connectionsTotal: null,
        followersTotal: null
    }
}