"use server";

import { LinkedinPost } from "./post";
import { APPTYPE } from "@/lib/enums";
import { getUrl } from "@/lib/utils";
import { api } from "@/lib/api";

export async function getPostById<T extends APPTYPE>(postId: string, platform: T): Promise<LinkedinPost> {
    const res = await api.get<LinkedinPost>(getUrl(`/${platform.toLowerCase()}/post`), {
        params: { postId }
    });

    return res.data;
}