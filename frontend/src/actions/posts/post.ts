import { APPTYPE } from "@/lib/enums";
import { JsonValue } from "@/lib/types";

export type LinkedinPost = {
    id: string,
    category: string,
    angle: string | null,
    title: string,
    hook: string,
    body: string,
    cta: string,
    hook_technique: string,
    body_technique: string,
    cta_technique: string,
    comment: string,
    mediaType: string,
    templateId: string | null,
    contentSlots: JsonValue,
    status: string,
    scheduledDay: string,
    scheduledWindow: string,
    postedAt: Date,
    techniques: {
        techniqueSlug: string,
        technique: {
            role: string,
            description: string,
            content: string,
            category: string,
        }
    }[],
    performance: {
        day: number,
        reactions: number,
        comments: number,
        reposts: number,
        impressions: number,
    }[],
    slotUsage: {
        weekStartDate: Date
        consumedAt: Date
    }
}

export interface PlatformPostMap {
    [APPTYPE.LINKEDIN]: LinkedinPost;
    [APPTYPE.FACEBOOK]: LinkedinPost;
    [APPTYPE.INSTAGRAM]: LinkedinPost;
    [APPTYPE.THREADS]: LinkedinPost;
    [APPTYPE.X]: LinkedinPost;
    [APPTYPE.REDDIT]: LinkedinPost;
    [APPTYPE.HOME]: LinkedinPost;
    [APPTYPE.TIKTOK]: LinkedinPost;
}