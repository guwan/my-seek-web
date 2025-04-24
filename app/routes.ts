import { type RouteConfig,
    route,
    layout,
    index } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [

    index("./pages/Chat.tsx"),
    layout("./components/Layout.tsx", [
        route("list", "./pages/List.tsx"),
        route("detail/:id", "./pages/Detail.tsx"),
    ]),
    ...(await flatRoutes())
] satisfies RouteConfig;
