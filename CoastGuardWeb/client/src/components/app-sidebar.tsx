import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/store";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Waves, Map, FileText, PlusCircle, BarChart3, LogOut } from "lucide-react";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, clearAuth } = useAuthStore();

  const citizenMenu = [
    { title: "Dashboard", url: "/", icon: Map },
    { title: "My Reports", url: "/my-reports", icon: FileText },
  ];

  const officialMenu = [
    { title: "Dashboard", url: "/", icon: Map },
    { title: "All Reports", url: "/reports", icon: FileText },
  ];

  const analystMenu = [
    { title: "Dashboard", url: "/", icon: Map },
    { title: "Analytics", url: "/analyst", icon: BarChart3 },
  ];

  const menuItems =
    user?.role === "analyst" ? analystMenu :
    user?.role === "official" ? officialMenu :
    citizenMenu;

  const roleConfig = {
    citizen: { label: "Citizen", color: "bg-role-citizen" },
    official: { label: "State Official", color: "bg-role-official" },
    analyst: { label: "Data Analyst", color: "bg-role-analyst" },
  };

  const config = user ? roleConfig[user.role] : roleConfig.citizen;
  const initials = user?.userName
    ? user.userName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  function handleLogout() {
    clearAuth();
    setLocation("/login");
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Waves className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">CoastGuard</h2>
            <p className="text-xs text-muted-foreground">Hazard Monitoring</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.url)}
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "citizen" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <Button
                className="w-full justify-start"
                onClick={() => setLocation("/new-report")}
                data-testid="button-new-report"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={config.color}>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user?.userName || "User"}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {config.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
