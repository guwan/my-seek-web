import {deleteUserToken, getUserToken} from "~/lib/AuthUtils";
import type {Result} from "~/services/data";

/** 401 处理节流：页面并发请求同时返回 401 时只跳转一次 */
let lastUnauthorizedAt = 0;

/**
 * 统一处理未授权响应：清除失效 token 并跳转登录页。
 *
 * 不在 HTTP 层使用 alert —— 页面上有多处请求（会话列表、模型列表、当前用户等），
 * 每个都会拿到 401，会导致弹窗被反复触发，且点掉后仍停留在失效页面。
 */
function handleUnauthorized(): void {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    if (now - lastUnauthorizedAt < 2000) return;
    lastUnauthorizedAt = now;

    deleteUserToken();

    // 已在登录页则不再跳转，避免 登录页 -> 探测 -> 401 -> 跳登录页 的死循环
    if (window.location.pathname === '/login') return;

    const redirect = window.location.pathname + window.location.search;
    window.location.replace('/login?redirect=' + encodeURIComponent(redirect));
}

class HttpClient {
    private baseUrl: string;
    private getToken?: () => string | null;

    constructor(baseUrl: string, getToken?: () => string | null) {
        // 在开发和测试环境中，使用相对路径，这样请求会通过 Vite 代理
        // 在生产环境中，使用传入的 baseUrl
        this.baseUrl = import.meta.env.DEV || import.meta.env.MODE === 'test'
            ? ''
            : baseUrl;
        this.getToken = getToken;
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        // 如果baseUrl为空，使用当前页面URL作为基础
        const url = this.resolveUrl(endpoint);

        // 处理 URL 参数
        if (params) {
            Object.keys(params).forEach(key =>
                url.searchParams.append(key, params[key])
            );
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<T>(response);
    }

    /**
     * GET 请求并返回统一的 Result 结构（后端返回体本身即 Result）。
     */
    async getRet<T>(endpoint: string, params?: Record<string, any>): Promise<Result<T>> {
        const url = this.resolveUrl(endpoint);

        if (params) {
            Object.keys(params).forEach(key =>
                url.searchParams.append(key, params[key])
            );
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return this.handleResponse<Result<T>>(response);
    }

    async post<T>(endpoint: string, body?: Record<string, any>, options?: RequestInit): Promise<T> {
        // 如果baseUrl为空，使用当前页面URL作为基础
        const url = this.resolveUrl(endpoint);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            ...options,
        });

        return this.handleResponse<T>(response);
    }
    async put<T>(endpoint: string, body?: Record<string, any>): Promise<T> {
        const url = this.resolveUrl(endpoint);
        const response = await fetch(url.toString(), {
            method: 'PUT',
            headers: {...this.getHeaders(), 'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(response);
    }

    async patch<T>(endpoint: string, params?: Record<string, any>, body?: Record<string, any>): Promise<T> {
        const url = this.resolveUrl(endpoint);
        if (params) {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }
        const response = await fetch(url.toString(), {
            method: 'PATCH',
            headers: {...this.getHeaders(), 'Content-Type': 'application/json'},
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async delete<T>(endpoint: string): Promise<T> {
        const url = this.resolveUrl(endpoint);
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    async postRet(endpoint: string, body?: Record<string, any>, options?: RequestInit) {
        // 如果baseUrl为空，使用当前页面URL作为基础
        const url = this.resolveUrl(endpoint);

        return fetch(url.toString(), {
            method: 'POST',
            headers: {
                ...this.getHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            ...options,
        });
    }

    /** 上传文件：不设置 Content-Type，由浏览器生成 multipart boundary */
    async postForm<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
        const url = this.resolveUrl(endpoint);
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: this.getHeaders(),
            body: formData,
            ...options,
        });
        return this.handleResponse<T>(response);
    }

    /**
     * 拼接请求地址。SSR 环境下没有 window，需要安全降级。
     */
    private resolveUrl(endpoint: string): URL {
        const base = this.baseUrl
            || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        return new URL(endpoint, base);
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {};
        const token = this.getToken?.();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const text = await response.text();
        let responseData: any;

        try {
            responseData = text ? JSON.parse(text) : {};
        } catch {
            // 非 JSON 响应（如网关错误页）统一包装为 Result 结构
            responseData = { success: false, code: response.status, msg: text || response.statusText };
        }

        // HTTP 401（JWT 过滤器拦截）或业务码 401（如 currentUser 未登录）都视为未授权
        if (response.status === 401 || responseData?.code === 401) {
            handleUnauthorized();
            throw new Error('未登录或登录已过期');
        }

        // 处理 HTTP 错误状态码（后端统一使用 msg 字段）
        if (!response.ok) {
            const errorMsg = responseData?.msg || responseData?.message || `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }

        return responseData as T;
    }
}

export const httpClient = new HttpClient(
    typeof window !== 'undefined' ? window.location.origin : '',
    () => getUserToken()
);