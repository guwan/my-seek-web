import {getUserToken} from "~/lib/AuthUtils";
import type {Result} from "~/services/data";

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

        // 处理 401 未授权
        if (responseData?.code === 401) {
            if (typeof window !== 'undefined') {
                window.alert('登录状态已失效，请重新登录');
            }
            throw new Error('Unauthorized');
        }

        // 处理 HTTP 错误状态码（后端统一使用 msg 字段）
        if (!response.ok) {
            const errorMsg = responseData?.msg || responseData?.message || `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }

        return responseData as T;
    }
}

// 使用示例
export const httpClient = new HttpClient(
    typeof window !== 'undefined' ? window.location.origin : '',
    () => getUserToken() // 从 localStorage 获取 token 的示例
);

/*// GET 请求示例
httpClient.get<{ data: any }>('/users', { page: 1, limit: 10 })
    .then(data => console.log(data))
    .catch(error => console.error(error));

// POST 请求示例
httpClient.post<{ id: number }>('/users', { name: 'John', age: 30 })
    .then(data => console.log(data))
    .catch(error => console.error(error));*/

// 使用示例
export const httpClientNoAuth = new HttpClient(
    ''
);