import {getUserToken} from "~/lib/AuthUtils";

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
        const url = new URL(endpoint, this.baseUrl || window.location.origin);

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

    async post<T>(endpoint: string, body?: Record<string, any>, options?: RequestInit): Promise<T> {
        // 如果baseUrl为空，使用当前页面URL作为基础
        const url = new URL(endpoint, this.baseUrl || window.location.origin);

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

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {};
        const token = this.getToken?.();

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        let responseData;

        try {
            responseData = await response.json();
        } catch (error) {
            throw new Error('Invalid JSON response');
        }

        // 处理 401 未授权
        if (responseData.code === 401) {
            alert('Session expired, please login again');
            // 这里可以添加跳转登录页面的逻辑
            throw new Error('Unauthorized');
        }

        // 处理 HTTP 错误状态码
        if (!response.ok) {
            const errorMsg = responseData.message || `Request failed with status ${response.status}`;
            throw new Error(errorMsg);
        }

        return responseData as T;
    }
}

// 使用示例
export const httpClient = new HttpClient(
    window.location.origin,
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