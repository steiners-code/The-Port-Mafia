import { Icon, FacebookLogoIcon, InstagramLogoIcon, LinkedinLogoIcon, XLogoIcon, ThreadsLogoIcon, RedditLogoIcon, TiktokLogoIcon } from "@phosphor-icons/react";
import { initiateLinkedInAuth } from "@/actions/connect-apps";
import { APPTYPE } from "@/lib/enums";

export type connectedApp = {
    id: string,
    name: string,
    icon: Icon,
    enable: boolean,
    colors: {
        bg: string,
        text: string,
        logo: string,
        button: string,
    },
    connectAction?: () => void;
}

const connectedApps: connectedApp[] = [
    {
        id: APPTYPE.LINKEDIN,
        name: "LinkedIn",
        icon: LinkedinLogoIcon,
        enable: true,
        colors: {
            bg: "bg-[#0C67C4]/5 hover:bg-[#0C67C4]/10!",
            text: "group-hover:text-[#0C67C4] group-hover:text-foreground!",
            logo: "group-hover:fill-[#0C67C4] fill-[#0C67C4] group-hover:text-foreground!",
            button: "hover:bg-[#0C67C4]/80! rounded-sm!"
        },
        connectAction: initiateLinkedInAuth
    },
    {
        id: APPTYPE.X,
        name: "X",
        icon: XLogoIcon,
        enable: false,
        colors: {
            bg: "bg-[#000000]/10 hover:bg-[#000000]/15",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/40!"
        }
    },
    {
        id: APPTYPE.REDDIT,
        name: "Reddit",
        icon: RedditLogoIcon,
        enable: false,
        colors: {
            bg: "bg-[#FF4500]/5 hover:bg-[#FF4500]/10",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/40!"
        }
    },
    {
        id: APPTYPE.THREADS,
        name: "Threads",
        icon: ThreadsLogoIcon,
        enable: false,
        colors: {
            bg: "bg-[#000000]/10 hover:bg-[#000000]/15",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
    {
        id: APPTYPE.INSTAGRAM,
        name: "Instagram",
        icon: InstagramLogoIcon,
        enable: false,
        colors: {
            bg: "bg-linear-to-r from-[#4662DE]/5 hover:from-[#4662DE]/10 via-[#FF0766]/5 hover:via-[#FF0766]/10 to-[#FFB64E]/5 hover:to-[#FFB64E]/10",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
    {
        id: APPTYPE.FACEBOOK,
        name: "Facebook",
        icon: FacebookLogoIcon,
        enable: false,
        colors: {
            bg: "bg-[#1877F2]/5 hover:bg-[#1877F2]/10",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    },
    {
        id: APPTYPE.TIKTOK,
        name: "TikTok",
        icon: TiktokLogoIcon,
        enable: false,
        colors: {
            bg: "bg-linear-to-r from-[#00F3EE]/5 hover:from-[#00F3E9]/10 via-[#ffffff]/5 hover:via-[#ffffff]/10 to-[#FD2C55]/5 hover:to-[#FD2C55]/10",
            text: "group-hover:text-foreground!",
            logo: "group-hover:text-foreground! text-muted-foreground!",
            button: "hover:bg-[#]/80!"
        }
    }
];

export default connectedApps as connectedApp[];