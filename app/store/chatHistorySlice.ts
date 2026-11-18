import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {ChatItem} from "~/services/data";

interface ChatHistoryState {
    messages: ChatItem[];
}

const CHAT_HISTORY_KEY = "myseek-chat-history-v1";

function loadHistory(): ChatItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed as ChatItem[];
        }
    } catch {
        // 数据损坏时忽略
    }
    return [];
}

const initialState: ChatHistoryState = {
    messages: loadHistory(),
};

export const chatHistorySlice = createSlice({
    name: 'chatHistory',
    initialState,
    reducers: {
        // 新增消息（按 id 去重，避免后端刷新后重复）
        addChatHistory: (state, action: PayloadAction<ChatItem>) => {
            if (!state.messages.some(m => String(m.id) === String(action.payload.id))) {
                state.messages.push(action.payload);
            }
        },
        // 删除消息
        deleteMessage: (state, action: PayloadAction<string>) => {
            state.messages = state.messages.filter(msg => msg.id !== action.payload);
        },
        // 你还可以加其他功能，比如清空聊天记录
        clearMessages: (state) => {
            state.messages = [];
        },
    },
});

export const {addChatHistory,
    deleteMessage,
    clearMessages} = chatHistorySlice.actions;

/** 持久化本地会话历史 */
export function persistChatHistory(state: {chatHistorySetter: ChatHistoryState}) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state.chatHistorySetter.messages));
    } catch {
        // 忽略存储异常
    }
}

export default chatHistorySlice.reducer;
