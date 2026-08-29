import { PauseCircleIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useHighlightStore } from "@/hooks/use-highlight-content";
import { resumeWorkflow } from "@/actions/chat/resume-workflow";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SubAgents } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LinkedInContinueButton = ({
    message,
    id,
    role,
    messageId
}: {
    message: string;
    id: string;
    role: SubAgents["subAgentRole"];
    messageId: string;
}) => {
    const { highlightedId } = useHighlightStore();

    const { mutate, isPending } = useMutation({
        mutationFn: () => resumeWorkflow(role, id, messageId),
        onError: (err) => {
            toast.error("Couldn't resume", { description: err instanceof Error ? err.message : "Something went wrong." });
        },
    });

    return (
        <div className={cn(
            "w-full rounded-sm border p-4 mt-2! mb-4 flex flex-row items-center justify-between gap-5 transition-colors!",
            highlightedId === id ? "animate-border-shine" : "border-border"
        )}>
            <div className="w-2/3 flex items-start gap-2">
                <PauseCircleIcon
                    weight="regular"
                    size={24}
                    className="text-muted-foreground size-5 sm:size-6 md:size-5 lg:size-6 mt-px sm:mt-0.75 md:mt-0.5 lg:mt-0.75"
                />

                <div className="w-full flex-1 flex flex-col items-start gap-2">
                    <h1 className="text-foreground line-clamp-1 font-serif font-semibold text-sm sm:text-lg md:text-[1rem] lg:text-lg">
                        Paused — waiting on you
                    </h1>
                    <p className="line-clamp-2 md:line-clamp-3 text-xs sm:text-sm md:text-xs lg:text-sm text-muted-foreground">
                        [{role}] - {message}
                    </p>
                </div>
            </div>

            <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => mutate()}
                className="cursor-pointer text-foreground"
            >
                <ArrowClockwiseIcon
                    weight="bold"
                    size={14}
                    className={cn(isPending && "animate-spin")}
                />
                {isPending ? "Resuming" : "Continue"}
            </Button>
        </div>
    );
};

export default LinkedInContinueButton;