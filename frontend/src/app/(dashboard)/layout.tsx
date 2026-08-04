import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import LayoutSidebar from "@/components/layout/LayoutSidebar";
import LayoutFooter from "@/components/layout/LayoutFooter";
import LayoutHeader from "@/components/layout/LayoutHeader";
import File from "@/components/chat/File";

export const metadata: Metadata = {
    title: "The Port Mafia",
    description: "An information network, run by agents who don't sleep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                <LayoutSidebar />

                <div className="w-full flex items-center overflow-hidden">
                    <div className="w-full h-screen flex-1 flex flex-col items-start overflow-auto thin-scrollbar bg-background">
                        <LayoutHeader />

                        <main className="w-full flex-1 px-4 sm:px-10 bg-inherit">
                            {children}
                        </main>

                        <LayoutFooter />
                    </div>

                    <File />
                </div>
            </div>
        </SidebarProvider>
    );
}