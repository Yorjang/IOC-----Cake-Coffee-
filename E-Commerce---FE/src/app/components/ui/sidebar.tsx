// Public API façade – re-exports from split files.
// sidebar-context.tsx  → context, provider, core Sidebar component
// sidebar-parts.tsx    → all sub-components (menu, group, items, etc.)

export { Sidebar, SidebarProvider, useSidebar } from "./sidebar-context";

export {
  SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction,
  SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail, SidebarSeparator, SidebarTrigger
} from "./sidebar-parts";
