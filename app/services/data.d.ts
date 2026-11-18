export type Result<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
    timestamp?: number;
    showType?: number;
};

export type UserInfo = {
    id?: number;
    openId?: string;
    avatar?: string;
    name?: string;
    phone?: string;
    company?: string;
    depart?: string;
    gender?: string;
    nickname?: string;
    job?: string;
};

export interface SearchSource {
    title: string;
    url: string;
}

export interface ChatMessage {
    id: number;
    type: 'user' | 'ai';
    content: string;
    reasoning?: string;
    reasoningMs?: number;
    reasoningStreaming?: boolean;
    sources?: SearchSource[];
    searchPerformed?: boolean;
    searchEngine?: string;
    isThinking?: boolean;
    error?: boolean;
}

export interface ChatItem {
    id: string;
    title: string;
    createAt?: string | number;
}

export interface MenuItem {
    id: number | string;
    title: string;
    url: string;
    createAt?: string | number;
    items?: MenuItem[];
}
