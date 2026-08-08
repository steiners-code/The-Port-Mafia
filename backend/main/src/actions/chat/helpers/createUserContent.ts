import { MainContentType } from "../../../generated/prisma";
import { JsonValue } from "@prisma/client/runtime/client"
import { Content, Metadata } from "../../../lib/types";

type UserContent = {
    contentType: MainContentType,
    message?: string | null,
    output?: JsonValue | Metadata
}

export type UserInputStep = {
    type: "user_input",
    content?: Content[]
}

export async function createUserContent(content: UserContent[]): Promise<UserInputStep> {
    let userContent: Content[] = []

    for (const c of content) {
        switch (c.contentType) {
            case "TEXT":
                userContent.push({
                    type: "text",
                    text: c.message!
                });
                break;
        }
    }

    return {
        type: "user_input",
        content: userContent
    }
}