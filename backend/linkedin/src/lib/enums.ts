export enum LOGLEVEL {
    ERROR = "ERROR",
    INFO = "INFO",
    WARN = "WARN"
}

export enum APPTYPE {
    HOME = "HOME",
    LINKEDIN = "LINKEDIN",
    X = "X",
    REDDIT = "REDDIT",
    FACEBOOK = "FACEBOOK",
    INSTAGRAM = "INSTAGRAM",
    THREADS = "THREADS",
    TIKTOK = "TIKTOK"
}

export enum APPSTATUS {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED"
}

export enum EventType {
    MESSAGECREATED = "message.created",
    MESSAGECOMPLETED = "message.completed",
    CONTENTCREATED = "content.created",
    CONTENTDELTA = "content.delta",
    CONTENTCOMPLETED = "content.completed",
}