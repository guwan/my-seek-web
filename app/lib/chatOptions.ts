export interface ChatOptions {
    /** 是否请求模型开启思考（对应后端 enableThinking） */
    enableThinking: boolean;
    /** 是否联网搜索 */
    webSearch: boolean;
    /** 是否参考当前用户上传的知识库文档 */
    useKnowledge: boolean;
}

export const CHAT_OPTIONS_KEY = "myseek-chat-options-v1";

export const DEFAULT_CHAT_OPTIONS: ChatOptions = {
    enableThinking: false,
    webSearch: false,
    // 用户希望默认用上知识库；关闭后偏好同样会被记住
    useKnowledge: true,
};

/** 读取用户上次的开关偏好；无记录或数据损坏时两个开关都默认关闭。 */
export function loadChatOptions(): ChatOptions {
    if (typeof window === "undefined") return DEFAULT_CHAT_OPTIONS;
    try {
        const raw = window.localStorage.getItem(CHAT_OPTIONS_KEY);
        if (!raw) return DEFAULT_CHAT_OPTIONS;
        const parsed = JSON.parse(raw);
        return {
            enableThinking: typeof parsed?.enableThinking === "boolean"
                ? parsed.enableThinking : DEFAULT_CHAT_OPTIONS.enableThinking,
            webSearch: typeof parsed?.webSearch === "boolean"
                ? parsed.webSearch : DEFAULT_CHAT_OPTIONS.webSearch,
            useKnowledge: typeof parsed?.useKnowledge === "boolean"
                ? parsed.useKnowledge : DEFAULT_CHAT_OPTIONS.useKnowledge,
        };
    } catch {
        return DEFAULT_CHAT_OPTIONS;
    }
}

/** 保存用户开关偏好；隐私模式下 localStorage 不可用时静默降级。 */
export function saveChatOptions(options: ChatOptions): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(CHAT_OPTIONS_KEY, JSON.stringify(options));
    } catch {
        // 忽略存储异常，不影响对话功能
    }
}
