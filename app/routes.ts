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
    ]),
    ...(await flatRoutes())
] satisfies RouteConfig;
