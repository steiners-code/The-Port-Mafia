import LinkedInContinueButton from "./component/LinkedInContinueButton";
import LinkedInConnectButton from "./component/LinkedInConnectButton";
import { Action, ComponentAction } from "@/lib/types/media"

const renderComponent = (id: string, data: ComponentAction, messageId: string) => {
    switch (data.name) {
        case "LinkedinConnectButton":
            return <LinkedInConnectButton id={id} message={data.message} />
        case "LinkedinContinueButton":
            return <LinkedInContinueButton id={id} message={data.message} role={data.role} messageId={messageId} />
    }
}

const MessageMediaAction = ({ output, id, messageId }: { output: Action, id: string, messageId: string }) => {
    switch (output.actionType) {
        case "COMPONENT":
            return renderComponent(id, output, messageId)
    }
}

export default MessageMediaAction
