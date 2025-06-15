import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/home/page.tsx"),
    route("/board", "routes/board/page.tsx"),
] satisfies RouteConfig;
