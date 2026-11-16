import {number} from "property-information/lib/util/types";

export type Result<T> = {
    code?: number;
    data?: T;
    msg?: string;
    success?: boolean;
    timestamp?: number;
    showType?: number;
};
export type Result_<T> = {
    code?: number;
    data: T;
    msg?: string;
    success?: boolean;
    timestamp?: number;
};
export type PageResult<T> = {
    code?: number;
    data: T;
    msg?: string;
    success?: boolean;
    timestamp?: number;
};
export type PageParams = {
    current?: number;
    pageSize?: number;
};

export type PageRes<T> = {
    current?: number;
    data: T;
    pageSize?: number;
    total?: number;
    success?: boolean;
};
export type UserInfo = {
    id?: number;
    openId?: string;
    avatar?: string;
    name?: string;
    phone?: string;
    company?: string;
    depart?: string;
    gender?: Gender;
    nickname?: string;
    job?: string;
}
export interface ChatMessage {
    id: number;
    type: 'user' | 'ai';
    content: string;
    isThinking?: boolean;
}

export interface ChatItem {
    id: string;
    title: string;
}

export interface MenuItem{
    id: number|string;
    title: string;
    url: string;
    items?: MenuItem[]
}