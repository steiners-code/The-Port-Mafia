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
                        background: "bg-[#3F332B]/20 dark:bg-[#B59B76]/20",
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
                        background: "bg-[#5261B0]/20 dark:bg-[#7794D1]/20",
                    },
                }
            ]
        }
    ];

    return routes;
};