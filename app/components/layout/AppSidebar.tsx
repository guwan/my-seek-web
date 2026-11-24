import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BookOpenText, Database, ListTodo, Loader2, MessageSquareText, PenLine, PlugZap, Plus, Sparkles, Trash2, UsersRound } from "lucide-react";

import { SearchForm } from "~/components/SearchForm";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "~/components/layout/sidebar";
import { clearChatItems, deleteChatItem, getChatItemList } from "~/components/Chat/service";
import { message } from "~/components/Message";
import { fetchCurrentUserInfo } from "~/components/LoginForm/service";
import { getUserToken } from "~/lib/AuthUtils";
import { CHAT_LIST_REFRESH_EVENT, NEW_CHAT_EVENT, NEW_WRITING_EVENT } from "~/lib/constants";
import type { MenuItem } from "~/services/data";
import type { RootState } from "~/store";
import { useAppDispatch } from "~/store";
import { clearMessages, deleteMessage } from "~/store/chatHistorySlice";
import { setCurrentUser } from "~/store/currentUserSlice";
import { formatItemTime, groupByTime } from "~/components/Chat/timeGroup";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [backendHistory, setBackendHistory] = useState<MenuItem[]>([]);
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(30);
    const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(() => new Set());
    const [clearingAll, setClearingAll] = useState(false);
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
    const visibleGroups = useMemo(() => {
        let remaining = visibleCount;
        return groupedHistory
            .map(group => {
                const items = group.items.slice(0, remaining);
                remaining -= items.length;
                return {...group, items};
            })
            .filter(group => group.items.length > 0);
    }, [groupedHistory, visibleCount]);

    useEffect(() => {
        setVisibleCount(30);
    }, [search]);

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

    const handleDeleteItem = async (item: MenuItem) => {
        const id = String(item.id);
        if (!confirm(`确定删除会话「${item.title}」吗？此操作不可撤销。`)) return;
        if (pendingDeleteIds.has(id)) return;

        const isCurrent = location.pathname === item.url;
        // 删除当前会话时先中止在途流，避免收尾回调又把会话写回列表
        if (isCurrent) window.dispatchEvent(new Event(NEW_CHAT_EVENT));
        setPendingDeleteIds(prev => new Set(prev).add(id));
        try {
            const res = await deleteChatItem(id);
            if (res.success === false) throw new Error(res.msg || "删除会话失败");
            dispatch(deleteMessage(id));
            setBackendHistory(prev => prev.filter(entry => String(entry.id) !== id));
            if (isCurrent) navigate("/");
            window.dispatchEvent(new Event(CHAT_LIST_REFRESH_EVENT));
        } catch (error) {
            message.error(error instanceof Error ? error.message : "删除会话失败");
        } finally {
            setPendingDeleteIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleClearAll = async () => {
        if (!historyItems.length) return;
        if (!confirm("确定删除全部会话吗？此操作不可撤销。")) return;
        if (clearingAll) return;

        const isInChat = location.pathname.startsWith("/chat/");
        if (isInChat) window.dispatchEvent(new Event(NEW_CHAT_EVENT));
        setClearingAll(true);
        try {
            const res = await clearChatItems();
            if (res.success === false) throw new Error(res.msg || "清空会话失败");
            dispatch(clearMessages());
            setBackendHistory([]);
            if (isInChat) navigate("/");
            window.dispatchEvent(new Event(CHAT_LIST_REFRESH_EVENT));
            message.success("已清空全部会话");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "清空会话失败");
        } finally {
            setClearingAll(false);
        }
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
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/tasks")}>
                                    <NavLink to="/tasks">
                                        <ListTodo className="size-4" />
                                        AI 任务中心
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
                        <div className="flex items-center justify-between px-2 pb-1">
                            <span className="text-[11px] text-muted-foreground">历史会话</span>
                            {historyItems.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    disabled={clearingAll || pendingDeleteIds.size > 0}
                                    title="删除全部会话"
                                    className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                >
                                    {clearingAll
                                        ? <Loader2 className="size-3 animate-spin" />
                                        : <Trash2 className="size-3" />}
                                    全部删除
                                </button>
                            )}
                        </div>
                        {visibleGroups.length > 0 ? (
                            <div className="space-y-3">
                                {visibleGroups.map(group => (
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
                                                    <SidebarMenuAction
                                                        showOnHover
                                                        type="button"
                                                        title="删除会话"
                                                        disabled={pendingDeleteIds.has(String(item.id)) || clearingAll}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            void handleDeleteItem(item);
                                                        }}
                                                    >
                                                        {pendingDeleteIds.has(String(item.id))
                                                            ? <Loader2 className="size-3 animate-spin" />
                                                            : <Trash2 className="size-3.5" />}
                                                    </SidebarMenuAction>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </div>
                                ))}
                                {visibleCount < historyItems.length && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(count => count + 30)}
                                        className="w-full rounded-md py-2 text-center text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                        加载更多（已显示 {Math.min(visibleCount, historyItems.length)} / {historyItems.length}）
                                    </button>
                                )}
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
