import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Contact, UsersRound, Send, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api-client";
import type { Guest, GuestGroup, EventSetting } from "@shared/types";
export default function UserDashboard() {
  const [stats, setStats] = useState({
    totalGuests: 0,
    guestGroups: 0,
    invitationsSent: 0,
  });
  const [eventSetting, setEventSetting] = useState<EventSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const profile = useAuthStore((state) => state.profile);
  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const [guestsData, groupsData, eventSettingData] = await Promise.all([
        api<Guest[]>(`/api/users/${profile.id}/guests`),
        api<GuestGroup[]>(`/api/users/${profile.id}/groups`),
        api<EventSetting>(`/api/users/${profile.id}/event-settings`),
      ]);
      setStats({
        totalGuests: guestsData.length,
        guestGroups: groupsData.length,
        invitationsSent: guestsData.filter(g => g.is_sent).length,
      });
      setEventSetting(eventSettingData);
    } catch (error) {
      // Silently fail for dashboard, or show a small toast
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  const statCards = [
    { title: "Total Guests", value: stats.totalGuests, icon: Contact },
    { title: "Guest Groups", value: stats.guestGroups, icon: UsersRound },
    { title: "Invitations Sent", value: stats.invitationsSent, icon: Send },
    { title: "RSVPs Received", value: "0", icon: CheckCircle2 }, // Placeholder
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's a summary of your event.</p>
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
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : eventSetting ? (
              <>
                <p className="text-muted-foreground">
                  Your event, <span className="font-semibold text-foreground">{eventSetting.event_name}</span>, is {eventSetting.is_active ? 'active' : 'inactive'}.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Invitation URL Slug: <code className="bg-slate-100 dark:bg-slate-800 p-1 rounded">/{eventSetting.invitation_slug}/</code>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Event settings have not been configured by the administrator.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}