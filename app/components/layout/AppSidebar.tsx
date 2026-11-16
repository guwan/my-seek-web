import * as React from "react"

import {SearchForm} from "~/components/SearchForm"
import {VersionSwitcher} from "~/components/version-switcher"
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
} from "~/components/layout/sidebar"
import {NavLink, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import type {ChatItem, MenuItem} from "~/services/data";
import {useSelector} from "react-redux";
import type {RootState} from "~/store";
import chat from "~/pages/Chat";
import {getChatHistory, getChatItemList} from "~/components/Chat/service";

// This is sample data.
const data = {
    versions: ["r1", "r0"],
    navFun: [
        {
            title: "开始",
            url: "#",
            items: [
                {
                    title: "新建对话",
                    url: "#",
                },
                {
                    title: "开始写作",
                    url: "#",
                },
            ],
        },
    ],
    navSettings: [
        {
            title: "配置",
            url: "#",
            items: [
                {
                    title: "会话配置",
                    url: "#",
                },
                {
                    title: "写作配置",
                    url: "#",
                },
            ],
        },
    ],
}

export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
    const [chatHistory, setChatHistory] = useState<MenuItem[]>([]);
    const location = useLocation();
    const navigate = useNavigate();


    const messages = useSelector((state: RootState) => state.chatHistorySetter.messages) as ChatItem[];

    useEffect(() => {
        const items = messages.map(m => {
            return {
                title: m.title,
                url: `/chat/${m.id}`
            } as MenuItem
        })
        setChatHistory([{
            id: "chat_history",
            title: "会话历史",
            url: "#",
            items,
        }])
    }, [messages]);
    useEffect(() => {
        getChatItemList().then(res=>{
            if(res.success){
                const his = res.data!.map(chatIntem=>{
                    return {
                        id: chatIntem.id,
                        title: chatIntem.title,
                        url: "/chat/"+chatIntem.id,
                    } as MenuItem;
                })
                setChatHistory(his)
            }
        })
    }, []);

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <VersionSwitcher
                    versions={data.versions}
                    defaultVersion={data.versions[0]}
                />
                <SearchForm/>
            </SidebarHeader>
            <SidebarContent>
                {/* 功能区 */}
                {data.navFun.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            //isActive={item.isActive}
                                            isActive={location.pathname.startsWith(item.url)}
                                        >
                                            {/*<a href={item.url} >{item.title}</a>*/}
                                            <NavLink to={item.url}>{item.title}</NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
                {/* 历史记录，动态后端生成 */}
                {chatHistory.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items!.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            //isActive={item.isActive}
                                            isActive={location.pathname.startsWith(item.url)}
                                        >
                                            {/*<a href={item.url} >{item.title}</a>*/}
                                            <NavLink to={item.url}>{item.title}</NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
                {/* 设置区 */}
                {data.navSettings.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            //isActive={item.isActive}
                                            isActive={location.pathname.startsWith(item.url)}
                                        >
                                            {/*<a href={item.url} >{item.title}</a>*/}
                                            <NavLink to={item.url}>{item.title}</NavLink>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail/>
        </Sidebar>
    )
}
