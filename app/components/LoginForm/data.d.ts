
export type CaptchaVo = {
    imageData: string;
    captchaKey: string;
};


export type LoginParams = {
    /** Password */
    password?: string;
    /** Username */
    username?: string;
    type?: string;
    autoLogin?: boolean;
    captchaKey?: string;
    captcha?: string;
};

type LoginResult = {
    loginType?: string;
    token?: string;
};

export type CurrentUser = {
    access?: string;
    avatar?: string;
    country?: string;
    email?: string;
    geographic?: string;
    group?: string;
    username?: string;
    name?: string;
    notifyCount?: number;
    signature?: string;
    tags?: UserTag[];
    title?: string;
    unreadCount?: number;
    userid?: string;
    phone?: string;
    dialPhone?: string;
    roles?: RoleQueryRes[];
};