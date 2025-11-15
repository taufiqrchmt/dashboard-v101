import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageSquareText, Settings, Contact } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Profile, MessageTemplate } from "@shared/types";
import { toast } from "sonner";
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    globalTemplates: 0,
    totalGuests: 0,
    activeEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, templatesData, guestsData, eventsData] = await Promise.all([
        api<Profile[]>('/api/admin/users'),
        api<MessageTemplate[]>('/api/admin/templates'),
        api<{ count: number }>('/api/admin/stats/guests'),
        api<{ count: number }>('/api/admin/stats/events'),
      ]);
      setStats({
        totalUsers: usersData.length,
        globalTemplates: templatesData.length,
        totalGuests: guestsData.count,
        activeEvents: eventsData.count,
      });
    } catch (error) {
      console.error("Failed to fetch admin dashboard data", error);
      toast.error("Could not load dashboard statistics.");
      setStats({ totalUsers: 0, globalTemplates: 0, totalGuests: 0, activeEvents: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users },
    { title: "Global Templates", value: stats.globalTemplates, icon: MessageSquareText },
    { title: "Total Guests", value: stats.totalGuests, icon: Contact },
    { title: "Active Events", value: stats.activeEvents, icon: Settings },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the application.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}