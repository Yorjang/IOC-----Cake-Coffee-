// Public API façade – re-exports from split files.
// sidebar-context.tsx  → context, provider, core Sidebar component
// sidebar-parts.tsx    → all sub-components (menu, group, items, etc.)

export { useSidebar, SidebarProvider, Sidebar } from "./sidebar-context";

export {
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./sidebar-parts";
