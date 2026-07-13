import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { appendAuditLog } from "@/lib/audit-logs-data";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  FileText,
  Mail,
  BookOpen,
  BarChart3,
  Bell,
  Settings,
  ScrollText,
  LogOut,
  ChevronDown,
  Landmark,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const userMgmtItems = [
  { title: "Students", url: "/students", icon: GraduationCap },
  { title: "Academic Supervisors", url: "/academic-supervisors", icon: UserCheck },
  { title: "Company Supervisors", url: "/company-supervisors", icon: UserCheck },
];

const otherItems = [
  { title: "Company Management", url: "/companies", icon: Building2 },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Letters", url: "/letters", icon: Mail },
  { title: "Logbooks", url: "/logbooks", icon: BookOpen },
  { title: "Reports & Analytics", url: "/reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "System Settings", url: "/settings", icon: Settings },
  { title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);
  const userMgmtOpen = userMgmtItems.some((i) => isActive(i.url));

  const handleLogout = () => {
    appendAuditLog({
      actorName: "Admin User",
      actorEmail: "admin@htu.edu.gh",
      actorRole: "Administrator",
      action: "logout",
      module: "auth",
      target: "Admin User",
      description: "Administrator signed out.",
      severity: "info",
    });
    setLogoutOpen(false);
    toast.success("Signed out successfully");
    navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Landmark className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-sidebar-foreground/60">
                ATTACHMENT
              </span>
              <span className="text-sm font-bold tracking-wide text-sidebar-foreground">
                ADMIN
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Collapsible defaultOpen={userMgmtOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="User Management">
                      <Users className="h-4 w-4" />
                      <span>User Management</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {userMgmtItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.url}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <Link to={sub.url}>
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {otherItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
            AD
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                Admin User
              </span>
              <span className="truncate text-xs text-sidebar-primary">
                Administrator
              </span>
            </div>
          )}
          {!collapsed && (
            <button
              className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
