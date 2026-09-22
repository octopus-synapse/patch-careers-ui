import { createLucideIcon } from "lucide-react-native";

/** Three staggered strokes shared by the web and native public menus. */
export const StaggeredMenu = createLucideIcon("StaggeredMenu", [
  ["path", { d: "M7 6h13", key: "top" }],
  ["path", { d: "M3 12h18", key: "middle" }],
  ["path", { d: "M7 18h9", key: "bottom" }],
]);
