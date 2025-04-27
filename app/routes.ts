import { type RouteConfig,
    route,
    layout,
    index } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
    layout("./components/Layout.tsx", [
        index("./pages/Chat.tsx"),
        //route("chat/:id", "./pages/Chat.tsx"),
        route("detail/:id", "./pages/Detail.tsx"),
    ]),
    ...(await flatRoutes())
] satisfies RouteConfig;
