// src/components/Layout.tsx
import { Link, Outlet } from "react-router-dom";
import {useState} from "react";
import Navbar from "~/components/Navbar";
import Sidebar from "~/components/Sidebar";

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="h-screen flex flex-col">
            <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* 添加 margin-left 过渡效果 */}
            <main className={`flex-1 bg-gray-50 p-4 transition-margin duration-300 ${
                sidebarOpen ? 'md:ml-64' : 'ml-0'
            }`}>
                <Outlet />
            </main>
        </div>
    );
}
