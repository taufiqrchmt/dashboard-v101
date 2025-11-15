import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toaster } from "@/components/ui/sonner";
type AppLayoutProps = {
  children: React.ReactNode;
};
export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AppSidebar />
        <SidebarInset>
          <div className="lg:hidden absolute left-4 top-4 z-20">
            <SidebarTrigger />
          </div>
          <main>
            {children}
          </main>
          <Toaster richColors />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}