import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, MessageSquareText, Send, User, Settings, LogOut, UsersRound, Contact, FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";
const commonLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
];
const userLinks = [
  { to: "/groups", icon: UsersRound, label: "Groups" },
  { to: "/guests", icon: Contact, label: "Guests" },
  { to: "/templates", icon: FileText, label: "Templates" },
  { to: "/send", icon: Send, label: "Send Invitations" },
];
const adminLinks = [
  { to: "/admin/users", icon: Users, label: "Manage Users" },
  { to: "/admin/templates", icon: MessageSquareText, label: "Global Templates" },
  { to: "/admin/settings", icon: Settings, label: "Event Settings" },
];
export function AppSidebar(): JSX.Element {
  const profile = useAuthStore(s => s.profile);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const links = profile?.role === 'admin' ? [...commonLinks, ...adminLinks] : [...commonLinks, ...userLinks];
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Send className="text-white h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Inviteable</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.to}>
              <NavLink to={link.to} className="w-full">
                {({ isActive }) => (
                  <SidebarMenuButton variant={isActive ? "primary" : "ghost"} className="w-full justify-start">
                    <link.icon className="h-5 w-5 mr-3" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 text-xs text-muted-foreground">
          Built with ❤️ at Cloudflare
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}