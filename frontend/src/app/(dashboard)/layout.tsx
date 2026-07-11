import LayoutHeader from "@/components/layout/LayoutHeader";
import LayoutSidebar from "@/components/layout/LayoutSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Port Mafia",
    description: "An information network, run by agents who don't sleep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                <LayoutSidebar />

                <div className="w-full flex flex-col items-start overflow-auto bg-background">
                    <LayoutHeader />

                    <main className="w-full flex-1 px-10 bg-inherit">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}