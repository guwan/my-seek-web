// src/components/Layout.tsx
import { Link, Outlet } from "react-router-dom";
import {useState} from "react";
import Navbar from "~/components/Navbar";
import Sidebar from "~/components/Sidebar";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "~/components/layout/sidebar";
import {AppSidebar} from "~/components/layout/AppSidebar";
import {Separator} from "~/components/layout/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "~/components/layout/breadcrumb";
import ChatComponent from "~/components/Chat/ChatComponent";

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        (
            <SidebarProvider>
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
                                    <BreadcrumbLink href="#">
                                        对话
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>问一个问题</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4" id={"chatContainer"}>
                        <Outlet/>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        )
    );
}
