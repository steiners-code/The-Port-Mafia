"use server"

import { APPSTATUS, APPTYPE } from "@/lib/enums";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

type AppMap = Record<APPTYPE, APPSTATUS>
type TypeAppData = {
    message: string,
    data: AppMap | null,
}

export async function getAppConnections() {
    try {
        const res = await api.get(getUrl("/main/user/connected-apps"));

        const data = res.data as TypeAppData;

        if (res.status !== 200 || !data.data)
            return null

        return data.data
    } catch (error) {
        return null
    }
}