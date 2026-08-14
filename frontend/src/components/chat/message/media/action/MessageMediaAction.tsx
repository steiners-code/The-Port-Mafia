import LinkedInConnectButton from "./component/LinkedInConnectButton";
import { Action, ComponentAction } from "@/lib/types/media"

const renderComponent = (componentName: ComponentAction["name"], id: string, message: ComponentAction["message"]) => {
    switch (componentName) {
        case "LinkedinConnectButton":
            return <LinkedInConnectButton id={id} message={message} />
    }
}

const MessageMediaAction = ({ output, id }: { output: Action, id: string }) => {
    switch (output.actionType) {
        case "COMPONENT":
            return renderComponent(output.name, id, output.message)
    }
}

export default MessageMediaAction
