import { MainContentType } from "../generated/prisma"
import { LOGLEVEL } from "./enums"

export type Logs = {
    timestamp: Date
    index: number
    level: LOGLEVEL
    status: number
    message: string
    details?: string
}

export type UserMessageData = {
    contents: {
        contentType: MainContentType,
        message?: string,
        output?: {
            contentId: string,
            metadata: Metadata
        }
    }[]
}

export type Metadata = {
    name: string,
    description?: string,
    extension: string,
    category: string, // Decide a custom category for those files store in db i.e. USER, MEMORY, JOURNAL, EXPERIENCE
}