import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
    route("/", "routes/home.tsx"),
    route("/board", "routes/whiteboard.tsx"),
] satisfies RouteConfig;
