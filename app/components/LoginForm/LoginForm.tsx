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
import type {CaptchaVo, LoginParams, LoginResult} from "~/components/LoginForm/data";
import {saveUserToken} from "~/lib/AuthUtils";
import {useDispatch} from "react-redux";
import type {AppDispatch} from "~/store";
import {setCurrentUser} from "~/store/currentUserSlice";
import {useNavigate} from "react-router";
import type {Result} from "~/services/data";
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

    const [captchaCode, setCaptchaCode] = useState('');
    const [captcha, setCaptcha] = useState<CaptchaVo | null>(null);
    const [loading, setLoading] = useState(false);
    const [changeTimestamp, setChangeTimestamp] = useState<number>();
    const location = useLocation();
    const navigate = useNavigate();
    const {login}  = useAuth(); // 获取登录方法
    const dispatch = useDispatch<AppDispatch>();

    // 获取来源路径或默认首页
    const from = location.state?.from?.pathname || '/';

    const [userLoginState, setUserLoginState]
        = useState<Result<LoginResult>>({success: true, code: 200});

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
            setFormData({...formData, captchaKey})
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
            // 登录
            const result = await loginRequest(formData);
            if (result.code === 200) {
                message.success("登录成功")

                login(result.data as string);

                saveUserToken(result.data as string);
                setLoading(false);

                /*const userInfoResult = await fetchUserInfo();
                const userMenuResult = await fetchUserMenu();


                const urlParams = new URL(window.location.href).searchParams;

                Promise.all([userInfoResult, userMenuResult]).then(() => {
                  //console.log("登录成功,跳转到：",urlParams.get('redirect') || '/welcome')
                  refresh();
                  console.log("userInfoResult和userMenuResult:",userInfoResult,userMenuResult)
                  history.push(urlParams.get('redirect') || '/welcome');
                })*/

                const urlParams = new URL(window.location.href).searchParams;
                await fetchCurrentUserInfo()
                    .then((res) => {

                        dispatch(setCurrentUser(res.data!));
                        //const from = urlParams.get('redirect') || '/welcome';
                        navigate(from, {replace: true});
                    })
                return;
            }
            setLoading(false);
            console.log(result);
            // 如果失败去设置用户错误信息
            setError(result.msg!)
            refreshCaptcha()
        } catch (error) {
            setLoading(false);
            console.log(error);
            message.error("登录失败，请重试！");
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
                                    <Label htmlFor="email">账号或邮箱</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        //type="email"
                                        placeholder="账号或邮箱"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">密码</Label>
                                    </div>
                                    <Input id="password"
                                           type="password"
                                           required
                                           value={formData.password}
                                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>验证码</Label> {/* 建议添加Label保持结构一致 */}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="验证码"
                                            value={formData.captcha}
                                            onChange={(e) => setFormData({...formData, captcha: e.target.value})}
                                            // value={captchaCode}
                                            // onChange={(e) => setCaptchaCode(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
                                            required
                                        />
                                        {/* 始终保留验证码容器 */}
                                        <div
                                            className="h-10 w-24 border border-gray-200 rounded-md shrink-0 flex items-center justify-center"
                                            onClick={refreshCaptcha}
                                        >
                                            {captcha ? (
                                                <img
                                                    src={captcha.imageData}
                                                    alt="验证码"
                                                    className="w-full h-full object-contain cursor-pointer"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-400">加载中...</span>
                                            )}
                                        </div>
                                    </div>

                                </div>

                                {/* 错误提示 */}
                                {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}

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
                            {/* 底部链接 */}
                            <div className="flex justify-between text-sm">
                                <a
                                    href="#"
                                    className="underline underline-offset-4 hover:underline text-gray-600"
                                >
                                    忘记密码?
                                </a>
                                <div className="text-gray-600">
                                    没有账号?{" "}
                                    <a
                                        href="#"
                                        className="underline underline-offset-4 hover:underline"
                                    >
                                        注册
                                    </a>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <div
                className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                点击继续, 则表示您同意我们的 <a href="#">服务条款</a>{" "}和 <a href="#">隐私政策</a>.
            </div>
        </div>
    )
}
