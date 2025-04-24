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
import {useEffect, useState} from "react";
import StringUtil from "~/lib/StringUtil";
import {fetchCurrentUserInfo, getCaptcha, login} from "~/components/LoginForm/service";
import {message} from "~/components/Message";
import type {CaptchaVo, LoginParams, LoginResult} from "~/components/LoginForm/data";
import {saveUserToken} from "~/lib/AuthUtils";
import {useDispatch} from "react-redux";
import type {AppDispatch} from "~/store";
import {setCurrentUser} from "~/store/currentUserSlice";
import {useNavigate} from "react-router";
import type {Result} from "~/services/data";



export function LoginForm({
                              className,
                              ...props
                          }: React.ComponentPropsWithoutRef<"div">) {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [captcha, setCaptcha] = useState<CaptchaVo | null>(null);
    const [loading, setLoading] = useState(false);
    const [changeTimestamp, setChangeTimestamp] = useState<number>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
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
        }else {
            console.log("获取验证码失败：{}",data);
            message.error('获取验证码失败,请重试');
        }
    }
    const handleLogin = async (values: LoginParams) => {
        try {
            // 登录
            const result = await login({...values});
            if (result.code === 200) {
                message.success("登录成功")

                saveUserToken(result.data as string);

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
                        const from = urlParams.get('redirect') || '/welcome';
                        navigate(from, {replace: true});
                    })
                return;
            }
            console.log(result);
            // 如果失败去设置用户错误信息
            setUserLoginState(result);
        } catch (error) {
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
                    <form>
                        <div className="grid gap-6">
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">邮箱</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">密码</Label>
                                        <a
                                            href="#"
                                            className="ml-auto text-sm underline-offset-4 hover:underline"
                                        >
                                            忘记密码?
                                        </a>
                                    </div>
                                    <Input id="password" type="password" required/>
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>验证码</Label> {/* 建议添加Label保持结构一致 */}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="验证码"
                                            value={captchaCode}
                                            onChange={(e) => setCaptchaCode(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
                                            required
                                        />
                                        {captcha && (
                                            <img
                                                src={captcha.imageData}
                                                alt="验证码"
                                                className="h-10 w-24 cursor-pointer border border-gray-200 rounded shrink-0"
                                                onClick={refreshCaptcha}
                                            />
                                        )}
                                    </div>

                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600
                                hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl
                                transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 text-2xl">
                                登录
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                没有账号?{" "}
                                <a href="#" className="underline underline-offset-4">
                                    注册
                                </a>
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
