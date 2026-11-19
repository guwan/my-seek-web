import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BookOpenText, Database, MessageSquareText, PenLine, PlugZap, Plus, Sparkles, UsersRound } from "lucide-react";

import { SearchForm } from "~/components/SearchForm";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "~/components/layout/sidebar";
import { getChatItemList } from "~/components/Chat/service";
import { fetchCurrentUserInfo } from "~/components/LoginForm/service";
import { getUserToken } from "~/lib/AuthUtils";
import { CHAT_LIST_REFRESH_EVENT, NEW_CHAT_EVENT, NEW_WRITING_EVENT } from "~/lib/constants";
import type { MenuItem } from "~/services/data";
import type { RootState } from "~/store";
import { useAppDispatch } from "~/store";
import { setCurrentUser } from "~/store/currentUserSlice";
import { formatItemTime, groupByTime } from "~/components/Chat/timeGroup";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [backendHistory, setBackendHistory] = useState<MenuItem[]>([]);
    const [search, setSearch] = useState("");
    const localHistory = useSelector((state: RootState) => state.chatHistorySetter.messages);
    const currentUserAccess = useSelector((state: RootState) => state.currentUserSetter.value.access);
    const userLoadedRef = useRef(false);

    // 刷新页面后 Redux 状态为空；有 token 时补拉当前用户，恢复管理员菜单可见性。
    useEffect(() => {
        if (userLoadedRef.current || currentUserAccess || !getUserToken()) return;
        userLoadedRef.current = true;
        fetchCurrentUserInfo()
            .then(res => {
                if (res.success && res.data) dispatch(setCurrentUser(res.data as any));
            })
            .catch(() => {
                userLoadedRef.current = false;
            });
    }, [currentUserAccess, dispatch]);

    useEffect(() => {
        let active = true;
        const refresh = () => {
            getChatItemList()
                .then((res) => {
                    if (!active || !res.success || !res.data) return;
                    setBackendHistory(res.data.map((item) => ({
                        id: item.id,
                        title: item.title || "未命名会话",
                        url: `/chat/${item.id}`,
                        createAt: item.createAt,
                    })));
                })
                .catch(() => {
                    // 历史加载失败时保留空列表，不影响主界面使用
                });
        };
        // effect 依赖 pathname，路由变化时会重新执行；此处已覆盖进入会话页的场景，
        // 不再额外调用 refresh()，避免同一路由下重复请求（每次请求都会触发一次 JWT 鉴权日志）
        refresh();
        // 新会话产生后由 ChatComponent 触发刷新
        window.addEventListener(CHAT_LIST_REFRESH_EVENT, refresh);
        return () => {
            active = false;
            window.removeEventListener(CHAT_LIST_REFRESH_EVENT, refresh);
        };
    }, [location.pathname]);

    const historyItems = useMemo(() => {
        const backendIds = new Set(backendHistory.map((item) => String(item.id)));
        const localItems: MenuItem[] = localHistory
            .filter((item) => !backendIds.has(String(item.id)))
            .map((item) => ({
                id: item.id,
                title: item.title || "新会话",
                url: `/chat/${item.id}`,
                createAt: item.createAt,
            }));

        const keyword = search.trim().toLowerCase();
        return [...localItems, ...backendHistory].filter((item) =>
            !keyword || item.title.toLowerCase().includes(keyword)
        );
    }, [backendHistory, localHistory, search]);

    const groupedHistory = useMemo(() => groupByTime(historyItems), [historyItems]);

    const startNewChat = () => {
        navigate("/");
        window.dispatchEvent(new CustomEvent(NEW_CHAT_EVENT));
    };

    const startNewWriting = () => {
        // 打标记兜底：跨路由跳转时组件尚未挂载，事件可能丢失，写入台挂载时会读取该标记
        window.sessionStorage.setItem(NEW_WRITING_EVENT, "1");
        navigate("/write");
        // 若已在写作台则立即生效
        window.setTimeout(() => window.dispatchEvent(new Event(NEW_WRITING_EVENT)), 0);
    };

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex size-9 items-center justify-center rounded-lg text-white shadow-md shadow-purple-500/25">
                        <Sparkles className="size-4" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-semibold">MySeek</span>
                        <span className="text-xs text-muted-foreground">AI 对话工作台</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={startNewChat}
                    className="mx-1 flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 px-3 py-2.5 text-sm font-medium text-white shadow-md shadow-purple-500/25 transition-all hover:brightness-110"
                >
                    <Plus className="size-4" />
                    开启新对话
                </button>
                <SearchForm
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索会话..."
                />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>工作台</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname === "/" || location.pathname.startsWith("/chat/")}>
                                    <NavLink to="/">
                                        <MessageSquareText className="size-4" />
                                        AI 对话
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/write")}>
                                    <NavLink to="/write">
                                        <BookOpenText className="size-4" />
                                        写作工作台
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/knowledge")}>
                                    <NavLink to="/knowledge">
                                        <Database className="size-4" />
                                        知识库
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {currentUserAccess === "admin" && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/users")}>
                                        <NavLink to="/users">
                                            <UsersRound className="size-4" />
                                            用户管理
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/providers")}>
                                    <NavLink to="/providers">
                                        <PlugZap className="size-4" />
                                        AI 接口管理
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <button type="button" onClick={startNewWriting} className="w-full">
                                        <PenLine className="size-4" />
                                        新建写作
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="min-h-0 flex-1 overflow-y-auto">
                    <SidebarGroupContent>
                        {groupedHistory.length > 0 ? (
                            <div className="space-y-3">
                                {groupedHistory.map(group => (
                                    <div key={group.label}>
                                        <SidebarGroupLabel className="px-2 py-1 text-[11px]">{group.label}</SidebarGroupLabel>
                                        <SidebarMenu>
                                            {group.items.map((item) => (
                                                <SidebarMenuItem key={String(item.id)}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={location.pathname === item.url}
                                                        title={item.title}
                                                    >
                                                        <NavLink to={item.url}>
                                                            <span className="min-w-0 flex-1 truncate">{item.title}</span>
                                                            <span className="ml-1 shrink-0 text-[10px] text-muted-foreground/70">
                                                                {formatItemTime(item.createAt)}
                                                            </span>
                                                        </NavLink>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="px-2 py-4 text-xs text-muted-foreground">
                                {search.trim() ? "没有匹配的会话" : "还没有会话，开始一次对话吧"}
                            </p>
                        )}
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
