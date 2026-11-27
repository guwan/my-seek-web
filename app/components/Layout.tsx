import { Link, Outlet, useLocation } from "react-router-dom";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/layout/sidebar";
import { AppSidebar } from "~/components/layout/AppSidebar";
import { Separator } from "~/components/layout/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "~/components/layout/breadcrumb";

export default function Layout() {
    const location = useLocation();
    const isWriting = location.pathname.startsWith("/write");
    const isKnowledge = location.pathname.startsWith("/knowledge");
    const isTasks = location.pathname.startsWith("/tasks");
    const isCatalog = location.pathname.startsWith("/catalog");
    const isUsers = location.pathname.startsWith("/users");
    const isProviders = location.pathname.startsWith("/providers");
    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to={isWriting ? "/write" : isKnowledge ? "/knowledge" : isTasks ? "/tasks" : isCatalog ? "/catalog" : isUsers ? "/users" : isProviders ? "/providers" : "/"}>
                                        {isWriting ? "写作" : isKnowledge ? "知识库" : isTasks ? "AI 任务中心" : isCatalog ? "能力目录" : isUsers ? "用户管理" : isProviders ? "设置" : "对话"}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    {isWriting ? "新建章节" : isKnowledge ? "文档管理" : isTasks ? "任务列表" : isCatalog ? "专家 / 技能 / 连接器" : isUsers ? "内部账号" : isProviders ? "第三方 AI 接口" : "问一个问题"}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="flex min-h-0 flex-1 flex-col" id="chatContainer">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
