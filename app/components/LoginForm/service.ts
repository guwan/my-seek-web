import type {CaptchaVo, CurrentUser, LoginParams, LoginResult} from "~/components/LoginForm/data";
import type {Result} from "~/services/data";
import {httpClient} from "~/lib/request";

/** captcha GET /api/auth/captcha/base64 */
export async function getCaptcha(captchaKey : string,options?: { [key: string]: any }) {
    return httpClient.get<Result<CaptchaVo>>('/api/auth/captcha/base64', {captchaKey});
}

/** ${AuthController.login} POST /api/auth/login */
export async function login(
    params: LoginParams,
    options?: { [key: string]: any },
) {
    return httpClient.post<Result<LoginResult>>('/api/auth/login', {
        data: params,
        ...(options || {}),
    });
}

/** me GET /api/user/currentUser */
export async function fetchCurrentUserInfo(
) {
    return httpClient.get<Result<CurrentUser>>('/api/user/currentUser', {
        method: 'GET'
    });
}