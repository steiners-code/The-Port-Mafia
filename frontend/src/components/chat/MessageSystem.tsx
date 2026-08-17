import { useHighlightStore } from "@/hooks/use-highlight-content";
import { AGENT, MESSAGESTATUS, TYPE } from "@/lib/enums";
import MessageSystemAgent from "./MessageSystemAgent";
import MessageThought from "./message/MessageThought";
import MessageMedia from "./message/MessageMedia";
import { PendingMessage } from "./PendingMessage";
import { InfoIcon } from "@phosphor-icons/react";
import MessageTool from "./message/MessageTool";
import MessageText from "./message/MessageText";
import { getAgentByEnum } from "@/data/agents";
import { MessageContent } from "@/lib/types";
import { cn } from "@/lib/utils";

function renderMessage(content: MessageContent) {
    switch (content.contentType) {
        case TYPE.TEXT:
            return content.message && <MessageText key={content.id} status={content.status} content={content.message} />
        case TYPE.THOUGHT:
            return content.message && <MessageThought key={content.id} status={content.status} message={content.message} output={content.output} />
        case TYPE.TOOL:
            return content.message && <MessageTool key={content.id} status={content.status} message={content.message} output={content.output} />
        case TYPE.MEDIA:
            return <MessageMedia key={content.id} id={content.id} output={content.output} />
    }
}

function isCorrectSubAgent(agent: AGENT | null): agent is AGENT {
    if (!agent) return false;
    return Object.values(AGENT).includes(agent);
}

const MessageSystem = ({ status, contents, agentId, agent, textColors }: { status: MESSAGESTATUS, contents: MessageContent[], agent: AGENT | null, agentId?: string, textColors?: string }) => {
    const { highlightedId } = useHighlightStore();

    if (isCorrectSubAgent(agent)) {
        const subAgent = getAgentByEnum(agent)
        return <MessageSystemAgent contents={contents} messageColors={subAgent?.colors.message} />
    }

    if (status === MESSAGESTATUS.QUEUED) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground">
                <InfoIcon size={14} weight="light" />
                <span className="text-xs italic font-light">
                    This response has been queued...
                </span>
            </div>
        )
    }

    if (status === MESSAGESTATUS.PENDING && contents.length === 0) {
        return (
            <PendingMessage agentId={agentId || "osamu-dazai"} />
        );
    }

    return (
        <div className={cn("py-2 rounded-sm text-[1.025rem] space-y-2 pr-2 sm:pr-10 w-full", textColors)}>
            {contents.map(content => (
                <div
                    key={content.id}
                    id={content.id}
                    className={cn("w-full h-fit rounded-sm! px-2",
                        content.contentType !== "MEDIA" && highlightedId === content.id && "animate-pulse-highlight",
                    )}
                >
                    {renderMessage(content)}
                </div>
            ))}

            {/* {status === MESSAGESTATUS.PENDING && <PendingMessage agentId={agentId || "osamu-dazai"} />} */}
        </div>
    )
}

export default MessageSystem
