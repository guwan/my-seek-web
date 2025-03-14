// src/components/Layout.tsx
import { Link, Outlet } from "react-router-dom";

const Layout = () => {
    return (
        <div>
            {/* 顶部导航 */}
            <nav style={{
                padding: 20,
                background: "#eee",
                display: "flex",
                gap: 20
            }}>
                <Link to="/">首页</Link>
                <Link to="/list">列表页</Link>
            </nav>

            {/* 页面内容区域 */}
            <main style={{ padding: 20 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;