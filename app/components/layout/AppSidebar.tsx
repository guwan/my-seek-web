import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Sparkles } from "lucide-react";

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
import { NEW_CHAT_EVENT } from "~/lib/constants";
import type { MenuItem } from "~/services/data";
import type { RootState } from "~/store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const navigate = useNavigate();
    const [backendHistory, setBackendHistory] = useState<MenuItem[]>([]);
    const [search, setSearch] = useState("");
    const localHistory = useSelector((state: RootState) => state.chatHistorySetter.messages);

    useEffect(() => {
        let active = true;
        getChatItemList()
            .then((res) => {
                if (!active || !res.success || !res.data) return;
                setBackendHistory(res.data.map((item) => ({
                    id: item.id,
                    title: item.title || "未命名会话",
                    url: `/chat/${item.id}`,
                })));
            })
            .catch(() => {
                // 历史加载失败时保留空列表，不影响主界面使用
            });
        return () => {
            active = false;
        };
    }, []);

    const historyItems = useMemo(() => {
        const backendIds = new Set(backendHistory.map((item) => String(item.id)));
        const localItems: MenuItem[] = localHistory
            .filter((item) => !backendIds.has(String(item.id)))
            .map((item) => ({
                id: item.id,
                title: item.title || "新会话",
                url: `/chat/${item.id}`,
            }));

        const keyword = search.trim().toLowerCase();
        return [...localItems, ...backendHistory].filter((item) =>
            !keyword || item.title.toLowerCase().includes(keyword)
        );
    }, [backendHistory, localHistory, search]);

    const startNewChat = () => {
        navigate("/");
        window.dispatchEvent(new CustomEvent(NEW_CHAT_EVENT));
    };

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
                        <Sparkles className="size-4" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-semibold">MySeek</span>
                        <span className="text-xs text-muted-foreground">AI 对话工作台</span>
                    </div>
                </div>
                <SearchForm
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索会话..."
                />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <button type="button" onClick={startNewChat} className="w-full">
                                        <Plus className="size-4" />
                                        新建对话
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>会话历史</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {historyItems.length > 0 ? (
                            <SidebarMenu>
                                {historyItems.map((item) => (
                                    <SidebarMenuItem key={String(item.id)}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={location.pathname === item.url}
                                        >
                                            <NavLink to={item.url}>{item.title}</NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
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
