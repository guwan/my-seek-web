import {httpClient} from "~/lib/request";
import type {ChatItem, ChatMessage, Result} from "~/services/data";

/** GET /api/ai/chat/info */
export async function getChatInfo(
    params: { conversationId: string },
) {
    return httpClient.get<Result<ChatItem>>('/api/ai/chat/info', params);
}


/** GET /api/ai/chat/history */
export async function getChatHistory(
    params: { conversationId: string },
) {
    return httpClient.get<Result<ChatMessage[]>>('/api/ai/chat/history', params);
}


/** GET /api/ai/chat/item/list */
export async function getChatItemList() {
    return httpClient.get<Result<ChatItem[]>>('/api/ai/chat/item/list');
}
