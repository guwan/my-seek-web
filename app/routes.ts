import { type RouteConfig,
    route,
    layout,
    index } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
    //index("./pages/Chat.tsx"),
    layout("./components/Layout.tsx", [
        index("./pages/Chat.tsx"),
        route("chat/:id", "./pages/ChatDetail.tsx"),
        route("write", "./pages/Write.tsx"),
        route("knowledge", "./pages/Knowledge.tsx"),
        route("providers", "./pages/Providers.tsx"),
    ]),
    ...(await flatRoutes())
] satisfies RouteConfig;
