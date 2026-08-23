import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPostById } from "@/actions/posts/getPostById";
import { CopyIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { APPTYPE } from "@/lib/enums";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LinkedInPost = ({ id, postId }: { id: string, postId: string }) => {
    const [showMore, setShowMore] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ["post", postId],
        queryFn: async () => await getPostById(postId, APPTYPE.LINKEDIN),
        refetchInterval: 5 * 60 * 1000,
    })

    if (!data && isLoading) {
        return (
            <div id={id} className="w-full h-full flex items-center justify-center">
                <Loader2 size={18} className="text-muted-foreground animate-spin" />
            </div>
        )
    }

    if (!data) {
        return (
            <div id={id} className="w-full h-full flex items-center justify-center">
                <span className="italic font-sans font-medium text-xs text-destructive"><strong>404</strong> - Post disappeared under the sea.</span>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-accent rounded-sm w-full h-fit overflow-clip py-2 px-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[0.65rem]">{data.category}</span>
                </div>

                <div className={cn("bg-muted space-y-4 whitespace-pre-wrap", !showMore && "line-clamp-2")}>
                    <div>
                        <Accordion className="text-muted-foreground! group/technique">
                            <AccordionItem className="gap-0! mb-2">
                                <AccordionTrigger className="gap-3 **:data-[slot=accordion-trigger-icon]:m-0! **:data-[slot=accordion-trigger-icon]:text-inherit! **:data-[slot=accordion-trigger-icon]:transition-all! justify-start! group-hover/technique:text-foreground/80! p-0! text-xs text-muted-foreground/60 hover:text-foreground/80! cursor-pointer underline-offset-3 hover:no-underline">
                                    Hook Technique
                                </AccordionTrigger>
                                <AccordionContent className="text-xs! p-0! mt-1! px-2! mx-2 border-l-2">
                                    {data.hook_technique}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <p className="text-foreground text-sm">
                            {data.hook}
                        </p>
                    </div>

                    <div>
                        <Accordion className="text-muted-foreground! group/technique">
                            <AccordionItem className="gap-0! mb-2">
                                <AccordionTrigger className="gap-3 **:data-[slot=accordion-trigger-icon]:m-0! **:data-[slot=accordion-trigger-icon]:text-inherit! **:data-[slot=accordion-trigger-icon]:transition-all! justify-start! group-hover/technique:text-foreground/80! p-0! text-xs text-muted-foreground/60 hover:text-foreground/80! cursor-pointer underline-offset-3 hover:no-underline">
                                    Body Technique
                                </AccordionTrigger>
                                <AccordionContent className="text-xs! p-0! mt-1! px-2! mx-2 border-l-2">
                                    {data.body_technique}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <p className="text-foreground text-sm">
                            {data.body}
                        </p>
                    </div>

                    <div>
                        <Accordion className="text-muted-foreground! group/technique">
                            <AccordionItem className="gap-0! mb-2">
                                <AccordionTrigger className="gap-3 **:data-[slot=accordion-trigger-icon]:m-0! **:data-[slot=accordion-trigger-icon]:text-inherit! **:data-[slot=accordion-trigger-icon]:transition-all! justify-start! group-hover/technique:text-foreground/80! p-0! text-xs text-muted-foreground/60 hover:text-foreground/80! cursor-pointer underline-offset-3 hover:no-underline">
                                    CTA Technique
                                </AccordionTrigger>
                                <AccordionContent className="text-xs! p-0! mt-1! px-2! mx-2 border-l-2">
                                    {data.cta_technique}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <p className="text-foreground text-sm">
                            {data.cta}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[0.65rem]">{data.status}</span>
                    <span className="text-muted-foreground text-[0.65rem]">{data.scheduledDay} {data.scheduledWindow}</span>

                    <Button
                        size="xs"
                        variant="link"
                        className="text-[0.65rem]! h-fit! mx-auto! cursor-pointer m-0! p-0! text-muted-foreground/80! hover:text-foreground/80!"
                        onClick={() => setShowMore(prev => !prev)}
                    >
                        {!showMore ? "Show More" : "Show Less"}
                    </Button>
                </div>
            </div>

            <div className="bg-accent rounded-sm w-full h-fit overflow-clip py-2 px-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[0.65rem] uppercase">First Comment</span>
                    <span className="text-muted-foreground text-[0.65rem]">Posted By You</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="font-mono text-sm size-12! rounded-full bg-muted-foreground text-background/60 flex items-center justify-center">YOU</div>
                    <p className="flex-1 text-sm text-foreground">{data.comment}</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground text-[0.65rem] cursor-pointer p-0! size-3.5!"
                    >
                        <CopyIcon weight="regular" size={14} />
                    </Button>
                </div>
            </div>

            <div className="bg-accent rounded-sm w-full h-fit overflow-clip py-2 px-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-[0.65rem]">{data.mediaType}</span>
                    <span className="text-muted-foreground text-[0.65rem]">{data.templateId}</span>
                </div>

                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(data.contentSlots, null, 4)}
                </pre>
            </div>
        </div>
    )
}

export default LinkedInPost
