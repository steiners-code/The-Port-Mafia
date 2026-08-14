import type { Metadata } from "next";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatProvider } from "@/context/ChatContext";
import LayoutSidebar from "@/components/layout/LayoutSidebar";
import MediaDisplay from "@/components/chat/media/MediaDisplay";
import LayoutScrollContainer from "@/components/layout/LayoutScrollContainer";
import LayoutHeader from "@/components/layout/LayoutHeader";
import LayoutFooter from "@/components/layout/LayoutFooter";

export const metadata: Metadata = {
    title: "The Port Mafia",
    description: "An information network, run by agents who don't sleep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-screen overflow-hidden">
                <LayoutSidebar />

                <div className="relative w-full flex items-center overflow-hidden">
                    <LayoutScrollContainer>
                        <ChatProvider>
                            <LayoutHeader />

                            <main className="w-full flex-1 px-4 sm:px-10 bg-inherit">
                                {children}
                            </main>

                            <LayoutFooter />
                        </ChatProvider>
                    </LayoutScrollContainer>

                    <MediaDisplay />
                </div>
            </div>
        </SidebarProvider>
    );
}