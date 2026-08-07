export enum APPTYPE {
    LINKEDIN,
    X,
    REDDIT,
    FACEBOOK,
    INSTAGRAM,
    THREADS,
    TIKTOK,
}

export enum APPSTATUS {
    CONNECTED,
    DISCONNECTED
}

export enum LOGLEVEL {
    ERROR = "ERROR",
    INFO = "INFO",
    WARN = "WARN"
}

export enum EventType {
    MESSAGECREATED = "message.created",
    MESSAGECOMPLETED = "message.completed",
    CONTENTCREATED = "content.created",
    CONTENTDELTA = "content.delta",
    CONTENTCOMPLETED = "content.completed",
}