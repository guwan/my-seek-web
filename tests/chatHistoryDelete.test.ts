import {describe, expect, it} from "vitest";
import type {ChatItem} from "~/services/data";
import chatHistoryReducer, {clearMessages, deleteMessage} from "~/store/chatHistorySlice";

const items: ChatItem[] = [
    {id: "a", title: "会话 A", createAt: 1},
    {id: "b", title: "会话 B", createAt: 2},
];

describe("chatHistoryDelete", () => {
    it("deleteMessage 只移除目标会话", () => {
        const next = chatHistoryReducer({messages: items}, deleteMessage("a"));
        expect(next.messages.map(item => item.id)).toEqual(["b"]);
    });

    it("clearMessages 清空全部本地会话", () => {
        const next = chatHistoryReducer({messages: items}, clearMessages());
        expect(next.messages).toEqual([]);
    });
});
