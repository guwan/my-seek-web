import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {ChatItem, UserInfo} from "~/services/data";


interface ChatHistoryState {
    messages: ChatItem[];
}

const initialState: ChatHistoryState = {
    messages: [],
};

export const chatHistorySlice = createSlice({
    name: 'chatHistory',
    initialState,
    reducers: {
        // 新增消息
        addChatHistory: (state, action: PayloadAction<ChatItem>) => {
            state.messages.push(action.payload);
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
export default chatHistorySlice.reducer;
