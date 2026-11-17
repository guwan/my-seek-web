import { withProtection } from "~/auth/withProtection";
import ChatComponent from "~/components/Chat/ChatComponent";

function Chat() {
    return <ChatComponent />;
}

export default withProtection(Chat);
