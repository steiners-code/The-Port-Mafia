import { initiateLinkedInAuth } from "@/actions/connect-apps";
import { Icon, FacebookLogoIcon, InstagramLogoIcon, LinkedinLogoIcon, XLogoIcon, ThreadsLogoIcon } from "@phosphor-icons/react";

export type connectedApp = {
    id: string,
    name: string,
    icon: Icon,
    status: APPSTATUS,
    colors: {
        bg: string,
        text: string,
        logo: string,
        button: string,
    },
    connectAction?: () => void;
}

export enum APPSTATUS {
    UNAVAILABLE,
    CONNECTED,
    DISCONNECTED,
}

const connectedApps: connectedApp[] = [
    {
        id: "linkedin",
        name: "LinkedIn",
        icon: LinkedinLogoIcon,
        status: APPSTATUS.DISCONNECTED,
        colors: {
            bg: "bg-[#0C67C4]/5 hover:bg-[#0C67C4]/10!",
            text: "group-hover:text-[#0C67C4] group-hover:text-foreground!",
            logo: "group-hover:text-[#0C67C4] group-hover:text-foreground!",
            button: "hover:bg-[#0C67C4]/80! rounded-sm!"
        },
        connectAction: initiateLinkedInAuth
    },
    {
        id: "x",
        name: "X",
        icon: XLogoIcon,
        status: APPSTATUS.UNAVAILABLE,
        colors: {
            bg: "bg-[#000000]/15",
            text: "group-hover:text-[#]!",
            logo: "group-hover:text-[#]! text-muted-foreground!",
            button: "hover:bg-[#000000]/40!"
        }
    },
    {
        id: "instagram",
        name: "Instagram",
        icon: InstagramLogoIcon,
        status: APPSTATUS.UNAVAILABLE,
        colors: {
            bg: "bg-[#E34158]/5",
            text: "group-hover:text-[#]!",
            logo: "group-hover:text-[#]! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
    {
        id: "facebook",
        name: "Facebook",
        icon: FacebookLogoIcon,
        status: APPSTATUS.UNAVAILABLE,
        colors: {
            bg: "bg-[#1877F2]/5",
            text: "group-hover:text-[#]!",
            logo: "group-hover:text-[#]! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
    {
        id: "threads",
        name: "Threads",
        icon: ThreadsLogoIcon,
        status: APPSTATUS.UNAVAILABLE,
        colors: {
            bg: "bg-[#000000]/10",
            text: "group-hover:text-[#]!",
            logo: "group-hover:text-[#]! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
];

export default connectedApps as connectedApp[];