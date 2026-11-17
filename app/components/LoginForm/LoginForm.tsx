import {cn} from "~/lib/utils"
import {Button} from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {Input} from "~/components/ui/input"
import {Label} from "~/components/ui/label"
import {useContext, useEffect, useState} from "react";
import StringUtil from "~/lib/StringUtil";
import {fetchCurrentUserInfo, getCaptcha, loginRequest} from "~/components/LoginForm/service";
import {message} from "~/components/Message";
import type {CaptchaVo, LoginParams} from "~/components/LoginForm/data";
import {saveUserToken} from "~/lib/AuthUtils";
import {useDispatch} from "react-redux";
import type {AppDispatch} from "~/store";
import {setCurrentUser} from "~/store/currentUserSlice";
import {useNavigate} from "react-router";
import {useLocation} from "react-router-dom";
import {useAuth} from "~/auth/AuthContext";



export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentPropsWithoutRef<"div">) {

    const [error, setError] = useState('')
    const [formData, setFormData] = useState<LoginParams>({
        username: '',
        password: '',
        captcha: '',
        captchaKey: ''
    })

    const [captcha, setCaptcha] = useState<CaptchaVo | null>(null);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const {login}  = useAuth(); // 获取登录方法
    const dispatch = useDispatch<AppDispatch>();

    // 优先跳回 401 拦截时记录的来源路径，其次路由 state，最后首页
    const urlParams = new URL(window.location.href).searchParams;
    const from = urlParams.get('redirect') || location.state?.from?.pathname || '/';

    useEffect(() => {
        refreshCaptcha()
    }, []);

    /**
     * 获取验证码
     */
    const refreshCaptcha = async () => {
        const captchaKey = StringUtil.uuid(16, 16);
        const data = await getCaptcha(captchaKey);
        if (data.success) {
            setCaptcha(data.data!);
            setFormData(prev => ({...prev, captchaKey}))
        }else {
            console.log("获取验证码失败：{}",data);
            message.error('获取验证码失败,请重试');
        }
    }
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const result = await loginRequest(formData);
            if (result.code !== 200) {
                setError(result.msg || '登录失败');
                await refreshCaptcha();
                return;
            }

            const token = result.data as string;
            login(token);
            saveUserToken(token);

            const userInfo = await fetchCurrentUserInfo();
            if (userInfo.success && userInfo.data) {
                dispatch(setCurrentUser(userInfo.data));
            }
            message.success("登录成功");
            navigate(from, {replace: true});
        } catch (error) {
            console.error(error);
            message.error("登录失败，请重试！");
            await refreshCaptcha();
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">探索者，欢迎回来</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="username">账号或邮箱</Label>
                                    <Input
                                        id="username"
                                        autoComplete="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                                        placeholder="账号或邮箱"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">密码</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="captcha">验证码</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="captcha"
                                            type="text"
                                            placeholder="请输入验证码"
                                            value={formData.captcha}
                                            onChange={(e) => setFormData(prev => ({...prev, captcha: e.target.value}))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
                                            required
                                        />
                                        <button
                                            type="button"
                                            aria-label="点击刷新验证码"
                                            className="h-10 w-24 border border-gray-200 rounded-md shrink-0 flex items-center justify-center bg-white"
                                            onClick={refreshCaptcha}
                                        >
                                            {captcha ? (
                                                <img
                                                    src={captcha.imageData}
                                                    alt="验证码"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-400">加载中...</span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 错误提示 */}
                                {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

                                {/* 仅本地开发环境展示演示账号 */}
                                {import.meta.env.DEV && (
                                    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-700">
                                        <span>演示账号：demo　密码：123456</span>
                                        <button
                                            type="button"
                                            className="ml-2 underline underline-offset-2 hover:text-blue-900"
                                            onClick={() => setFormData(prev => ({...prev, username: 'demo', password: '123456'}))}
                                        >
                                            一键填入
                                        </button>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600
                                                hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl
                                                transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-2xl"
                                >

                                    {loading ? '登录中...' : '登录'}
                                </Button>
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                忘记密码或需要开通账号，请联系系统管理员。
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
