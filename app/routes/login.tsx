import { LoginForm } from "~/components/LoginForm/LoginForm"

// 在组件文件顶部添加自定义动画（Next.js可在全局CSS中添加）
import { cn } from "@/lib/utils"
import  '@/css/login.css'
import {clsx} from "clsx";

export default function Page() {
    return (
        <div className={cn(
            "flex min-h-svh w-full items-center justify-center p-6 md:p-10",
            "relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900" // 改为蓝紫渐变背景
        )}>
            {/* 粒子背景容器 */}
            <div className="absolute inset-0">
                {/* 背景光晕层 */}
                <div
                    className="absolute inset-0 [background:radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_60%)]"/>

                {/* 大粒子群组 (6组) */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={clsx(
                        "absolute h-96 w-96 rounded-full blur-[50px]",
                        i % 2 === 0
                            ? "bg-gradient-to-r from-violet-500/30 to-fuchsia-400/20"
                            : "bg-gradient-to-r from-indigo-400/20 to-purple-300/20",
                        `animate-float${i % 3 + 1}`,
                        i === 0 && "-top-20 -left-20",
                        i === 1 && "-bottom-40 -right-20",
                        i === 2 && "top-1/4 right-1/4",
                        i === 3 && "bottom-1/3 left-1/3",
                        i === 4 && "top-10 right-40",
                        i === 5 && "left-10 bottom-20"
                    )}/>
                ))}

                {/* 快速小粒子 (12个) */}
                {[...Array(12)].map((_, i) => (
                    <div key={i} className={clsx(
                        "absolute h-2 w-2 rounded-full blur-sm animate-fast-particle",
                        i % 3 === 0 ? "bg-purple-300/80" : "bg-blue-300/80",
                        `animate-fast-particle-${i % 4 + 1}`
                    )} style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`
                    }}/>
                ))}

                {/* 流动光带 (3条) */}
                <div
                    className="absolute -top-20 left-0 h-1 w-48 animate-sweep bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-40 blur-sm"/>
                <div
                    className="absolute top-1/3 right-0 h-1 w-48 animate-sweep-2 bg-gradient-to-r from-transparent via-blue-300 to-transparent opacity-40 blur-sm"/>
                <div
                    className="absolute bottom-20 left-1/4 h-1 w-64 animate-sweep-3 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-40 blur-sm"/>
            </div>

            {/* 增强玻璃质感表单 */}
            <div
                className="relative z-10 w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all hover:bg-white/15 hover:backdrop-blur-3xl">
                <LoginForm/>
            </div>
        </div>
    )
}
