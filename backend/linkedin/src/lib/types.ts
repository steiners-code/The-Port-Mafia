import { LOGLEVEL } from "./enums"

export type TypeLinkedinTokens = {
    access_token: string,
    expires_in: number,
    refresh_token: string,
    refresh_token_expires_in: number,
    scope: string,
    token_type: string,
    id_token: string
}

export type Logs = {
    timestamp: Date
    index: number
    level: LOGLEVEL
    status: number
    message: string
    details?: string
}