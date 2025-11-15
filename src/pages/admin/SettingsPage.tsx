import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Profile, EventSetting } from "@shared/types";
const eventSettingSchema = z.object({
  event_name: z.string().min(1, "Event name is required."),
  invitation_slug: z.string().min(1, "Invitation slug is required."),
  invitation_url: z.string().nullable().optional(),
  rsvp_url: z.string().nullable().optional(),
  rsvp_password: z.string().nullable().optional(),
  is_active: z.boolean().default(false),
});
type EventSettingFormValues = z.infer<typeof eventSettingSchema>;
export default function SettingsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [currentSetting, setCurrentSetting] = useState<EventSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<EventSettingFormValues>({
    resolver: zodResolver(eventSettingSchema),
    defaultValues: {
      event_name: "",
      invitation_slug: "",
      invitation_url: "",
      rsvp_url: "",
      rsvp_password: "",
      is_active: false,
    },
  });
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await api<Profile[]>('/api/admin/users');
      setUsers(allUsers.filter(u => u.role === 'user'));
    } catch (error) {
      toast.error("Failed to fetch users.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const handleUserChange = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setCurrentSetting(null);
      form.reset();
      return;
    }
    try {
      const setting = await api<EventSetting>(`/api/users/${userId}/event-settings`);
      setCurrentSetting(setting);
      form.reset({
        event_name: setting.event_name,
        invitation_slug: setting.invitation_slug,
        invitation_url: setting.invitation_url || "",
        rsvp_url: setting.rsvp_url || "",
        rsvp_password: setting.rsvp_password || "",
        is_active: setting.is_active,
      });
    } catch (error) {
      setCurrentSetting(null);
      form.reset();
      toast.info("No event settings found for this user. You can create one.");
    }
  }, [form]);
  const onSubmit = async (values: EventSettingFormValues) => {
    if (!selectedUserId) {
      toast.error("Please select a user first.");
      return;
    }
    const apiCall = currentSetting
      ? api(`/api/admin/users/${selectedUserId}/event-settings/${currentSetting.id}`, { method: 'PUT', body: JSON.stringify(values) })
      : api(`/api/admin/users/${selectedUserId}/event-settings`, { method: 'POST', body: JSON.stringify(values) });
    try {
      const updatedSetting = await apiCall;
      setCurrentSetting(updatedSetting as EventSetting);
      toast.success(`Settings ${currentSetting ? 'updated' : 'created'} successfully.`);
    } catch (error) {
      toast.error(`Failed to ${currentSetting ? 'update' : 'create'} settings.`);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Event Settings</h1>
        <p className="text-muted-foreground">Configure event details for each user.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configure User Event</CardTitle>
          <CardDescription>Select a user to view or edit their event settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="user-select">Select User</Label>
            {isLoading ? <Skeleton className="h-10 w-full" /> : (
              <Select onValueChange={handleUserChange} value={selectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          {selectedUserId && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="event_name" render={({ field }) => (<FormItem><FormLabel>Event Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="invitation_slug" render={({ field }) => (<FormItem><FormLabel>Invitation Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="invitation_url" render={({ field }) => (<FormItem><FormLabel>Invitation URL (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="rsvp_url" render={({ field }) => (<FormItem><FormLabel>RSVP URL</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="rsvp_password" render={({ field }) => (<FormItem><FormLabel>RSVP Password</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-2"><div className="space-y-0.5"><FormLabel>Event Active</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}