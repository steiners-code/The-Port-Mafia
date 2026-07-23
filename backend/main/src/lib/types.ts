import { LOGLEVEL } from "./enums"

export type Logs = {
    timestamp: Date
    index: number
    level: LOGLEVEL
    status: number
    message: string
    details?: string
}