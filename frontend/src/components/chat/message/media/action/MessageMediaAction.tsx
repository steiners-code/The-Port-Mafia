import LinkedInConnectButton from "./component/LinkedInConnectButton";
import { Action } from "@/lib/types/media"

const renderComponent = (data: Action, id: string) => {
    switch (data.name) {
        case "LinkedinConnectButton":
            return <LinkedInConnectButton message={data.message} id={id} />
    }
}

const MessageMediaAction = ({ output, id }: { output: Action, id: string }) => {
    switch (output.type) {
        case "COMPONENT":
            return renderComponent(output, id)
    }
}

export default MessageMediaAction
