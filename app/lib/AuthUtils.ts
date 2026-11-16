const user_token_key = 'proman_user_token';

/**
 * localStorage 仅在浏览器环境可用，SSR / 预渲染时安全降级。
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const getUserToken = () => {
    if (!isBrowser) return null;
    return localStorage.getItem(user_token_key);
};

export const saveUserToken = (token: string) => {
    if (!isBrowser) return;
    localStorage.setItem(user_token_key, token);
};

export const deleteUserToken = () => {
    if (!isBrowser) return;
    localStorage.removeItem(user_token_key);
};
