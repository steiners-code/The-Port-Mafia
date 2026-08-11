import { MainContentType } from "../../../generated/prisma";
import { JsonValue } from "@prisma/client/runtime/client"
import { Content, Step } from "../../../lib/types";

type UserContent = {
    contentType: MainContentType,
    message?: string | null,
    output?: JsonValue
}

export async function createUserContent(content: UserContent[]): Promise<Step> {
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

        }
    }

    return {
        type: "user_input",
        content: userContent
    }
}