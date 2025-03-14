import { type RouteConfig,
    route,
    layout,
    index } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
    layout("./components/Layout.tsx", [
        index("./pages/home.tsx"),
        route("list", "./pages/List.tsx"),
        route("detail/:id", "./pages/Detail.tsx"),
    ]),
    ...(await flatRoutes())
] satisfies RouteConfig;
