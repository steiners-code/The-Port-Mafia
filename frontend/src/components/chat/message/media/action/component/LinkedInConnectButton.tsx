import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { useHighlightStore } from "@/hooks/use-highlight-content";
import { initiateLinkedInAuth } from "@/actions/auth-apps";
import { Button } from "@/components/ui/button";
import connectedApps from "@/data/apps";
import { APPTYPE } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LinkedInConnectButton = ({ message, id }: { message?: string, id: string }) => {
    const { highlightedId } = useHighlightStore();
    const app = connectedApps.find(app => app.id === APPTYPE.LINKEDIN)

    if (!app) return (
        <div
            className={cn("w-full border rounded-sm p-4 my-2 flex items-center justify-between",
                highlightedId === id ? "animate-border-shine" : "border-border"
            )}
        >
            {message && <MarkdownContent content={message} />}
            <Button
                variant="ghost"
                className={cn("")}
                onClick={() => toast.error("Invalid App Type!", { description: "No such app exists for connection." })}
            >
                <span className="">Connect</span>
            </Button>
        </div>
    )

    const Icon = app.icon;
    return (
        <div className={cn("w-full border rounded-sm p-4 mt-2! mb-4 flex flex-row items-center justify-between gap-5 transition-colors!",
            app.colors.bg,
            highlightedId === id ? "animate-border-shine" : "border-border"
        )}>
            <div className={cn("w-2/3 flex items-start gap-2", app.colors.text)}>
                <Icon weight="regular" size={24} className={cn("size-5 sm:size-6 md:size-5 lg:size-6 mt-px sm:mt-0.75 md:mt-0.5 lg:mt-0.75", app.colors.logo)} />

                <div className="w-full flex-1 flex flex-col items-start gap-2">
                    <h1 className="line-clamp-1 font-serif font-semibold text-sm sm:text-lg md:text-[1rem] lg:text-lg">
                        LinkedIn Connection Request
                    </h1>
                    <p className="line-clamp-2 md:line-clamp-3 text-xs sm:text-sm md:text-xs lg:text-sm">{message}</p>
                </div>
            </div>

            <Button
                variant="ghost"
                disabled={!app.enable}
                className={cn("hover:text-background! cursor-pointer", app.colors.button, app.colors.bg)}
                onClick={initiateLinkedInAuth}
            >

                Connect Now
            </Button>
        </div>
    )
}

export default LinkedInConnectButton
