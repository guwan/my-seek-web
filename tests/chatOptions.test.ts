import {beforeEach, describe, expect, it} from "vitest";
import {
    CHAT_OPTIONS_KEY,
    DEFAULT_CHAT_OPTIONS,
    loadChatOptions,
    saveChatOptions,
} from "~/lib/chatOptions";

describe("chatOptions", () => {
    beforeEach(() => localStorage.clear());

    it("无偏好时深度思考与智能搜索关闭、知识库开启", () => {
        expect(loadChatOptions()).toEqual({enableThinking: false, webSearch: false, useKnowledge: true});
    });

    it("保存后能恢复上次的选中偏好", () => {
        saveChatOptions({enableThinking: true, webSearch: false, useKnowledge: false});

        expect(loadChatOptions()).toEqual({enableThinking: true, webSearch: false, useKnowledge: false});
        expect(localStorage.getItem(CHAT_OPTIONS_KEY)).toBeTruthy();
    });

    it("数据损坏时回退到默认关闭", () => {
        localStorage.setItem(CHAT_OPTIONS_KEY, "{broken");

        expect(loadChatOptions()).toEqual(DEFAULT_CHAT_OPTIONS);
    });

    it("兼容缺失字段的历史数据，知识库缺失时回退为开启", () => {
        localStorage.setItem(CHAT_OPTIONS_KEY, JSON.stringify({webSearch: true}));

        expect(loadChatOptions()).toEqual({enableThinking: false, webSearch: true, useKnowledge: true});
    });
});
