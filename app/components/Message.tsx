import React from "react";
import ReactDOM from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";

let container: HTMLDivElement | null = null;

type MessageType = "error" | "success" | "info";

interface MessageItem {
    id: string;
    type: MessageType;
    content: string;
}

let messages: MessageItem[] = [];
let update: (() => void) | null = null;

const MessageBox = () => {
    const [_, forceUpdate] = React.useReducer(x => x + 1, 0);
    update = forceUpdate;

    React.useEffect(() => {
        return () => {
            update = null;
        };
    }, []);

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
            <AnimatePresence>
                {messages.map(msg => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`px-4 py-2 rounded shadow-md text-white text-sm ${
                            msg.type === "error"
                                ? "bg-red-500"
                                : msg.type === "success"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                        }`}
                    >
                        {msg.content}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

function createContainer() {
    if (!container) {
        container = document.createElement("div");
        document.body.appendChild(container);
        ReactDOM.createRoot(container).render(<MessageBox />);
    }
}

function showMessage(type: MessageType, content: string) {
    createContainer();
    const id = Math.random().toString(36).substr(2, 9);
    messages.push({ id, type, content });
    update?.();

    setTimeout(() => {
        messages = messages.filter(msg => msg.id !== id);
        update?.();
    }, 3000);
}

export const message = {
    error: (content: string) => showMessage("error", content),
    success: (content: string) => showMessage("success", content),
    info: (content: string) => showMessage("info", content),
};
