import type {LoginParams, LoginResult} from "~/components/LoginForm/data";
import {httpClient} from "~/lib/request";
import type {ChatItem, ChatMessage, Result} from "~/services/data";

/** ${AuthController.login} POST /api/auth/login */
export async function getChatInfo(
    params: { conversationId: string },
) {
    return httpClient.get<Result<ChatItem>>('/api/ai/chat/info', params);
}


/** ${AuthController.login} POST /api/auth/login */
export async function getChatHistory(
    params: { conversationId: string },
) {
    return httpClient.get<Result<ChatMessage[]>>('/api/ai/chat/history', params);
}


/** ${AuthController.login} POST /api/auth/login */
export async function getChatItemList() {
    return httpClient.get<Result<ChatItem[]>>('/api/ai/chat/item/list', );
}
