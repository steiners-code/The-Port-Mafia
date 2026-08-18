import { MainContentType } from "../../../generated/prisma";
import { Content, Output, Step } from "../../../lib/types";
import { JsonValue } from "@prisma/client/runtime/client";
import { fetchMediaContent } from "./fetchMediaContent";

type UserContent = {
    contentType: MainContentType,
    message?: string | null,
    output?: Output | JsonValue
}

export async function createUserContent(content: UserContent[], userId: string): Promise<Step> {
    let userContent: Content[] = [];

    for (const c of content) {
        switch (c.contentType) {
            case "TEXT":
                userContent.push({
                    type: "text",
                    text: c.message!
                });
                break;
            case "MEDIA":
                if (typeof c.output !== "object" || Array.isArray(c.output) || c.output === null) break;
                const content = await fetchMediaContent(c.output as Output, userId)
                userContent.push(...content)
        }
    }

    return {
        type: "user_input",
        content: userContent
    }
}