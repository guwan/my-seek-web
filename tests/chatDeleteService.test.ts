import {beforeEach, describe, expect, it, vi} from "vitest";

const {deleteMock} = vi.hoisted(() => ({deleteMock: vi.fn()}));

vi.mock("~/lib/request", () => ({httpClient: {delete: deleteMock}}));

import {clearChatItems, deleteChatItem} from "~/components/Chat/service";

describe("chat delete service", () => {
    beforeEach(() => deleteMock.mockReset());

    it("删除单个会话时转义 conversationId", async () => {
        deleteMock.mockResolvedValue({success: true});

        await deleteChatItem("a b/c");

        expect(deleteMock).toHaveBeenCalledWith("/api/ai/chat/item/a%20b%2Fc");
    });

    it("清空全部会话调用批量删除接口", async () => {
        deleteMock.mockResolvedValue({success: true});

        await clearChatItems();

        expect(deleteMock).toHaveBeenCalledWith("/api/ai/chat/item");
    });
});
