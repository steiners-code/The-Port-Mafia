export function getRoutes() {
    const routes = [
        {
            groupLabel: "Port Mafia",
            children: [
                {
                    label: "Osamu Dazai",
                    avatar: "/dazai-avatar.png",
                    href: "/main",
                    colors: {
                        text: "text-[#3F332B] dark:text-[#B59B76]",
                        background: "bg-[#B59B76]/50! dark:bg-[#3F332B]/50!",
                        hover: "bg-[#B59B76]/20 dark:bg-[#3F332B]/20 hover:bg-[#B59B76]/30 dark:hover:bg-[#3F332B]/30"
                    }
                }
            ]
        },
        {
            groupLabel: "LinkedIn",
            children: [
                {
                    label: "Maha Balor",
                    avatar: "/maha-avatar.png",
                    href: "/linkedin",
                    colors: {
                        text: "text-[#5261B0] dark:text-[#7794D1]",
                        background: "bg-[#7794D1]/50! dark:bg-[#5261B0]/50!",
                        hover: "bg-[#7794D1]/20 dark:bg-[#5261B0]/20 hover:bg-[#7794D1]/30 dark:hover:bg-[#5261B0]/30"
                    },
                }
            ]
        }
    ];

    return routes;
};