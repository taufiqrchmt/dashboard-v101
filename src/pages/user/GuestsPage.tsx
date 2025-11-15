import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth";
import type { Guest, GuestGroup } from "@shared/types";
const guestSchema = z.object({
  name: z.string().min(1, "Guest name is required."),
  phone: z.string().optional(),
  group_id: z.string().optional(),
  notes: z.string().optional(),
});
type GuestFormValues = z.infer<typeof guestSchema>;
export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const profile = useAuthStore((state) => state.profile);
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestSchema),
    defaultValues: { name: "", phone: "", group_id: "", notes: "" },
  });
  const fetchData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const [guestsData, groupsData] = await Promise.all([
        api<Guest[]>(`/api/users/${profile.id}/guests`),
        api<GuestGroup[]>(`/api/users/${profile.id}/groups`),
      ]);
      setGuests(guestsData);
      setGroups(groupsData);
    } catch (error) {
      toast.error("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleModalOpen = (guest: Guest | null = null) => {
    setSelectedGuest(guest);
    if (guest) {
      form.reset({ name: guest.name, phone: guest.phone || "", group_id: guest.group_id || "", notes: guest.notes || "" });
    } else {
      form.reset({ name: "", phone: "", group_id: "", notes: "" });
    }
    setIsModalOpen(true);
  };
  const handleDeleteOpen = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDeleteDialogOpen(true);
  };
  const onSubmit = async (values: GuestFormValues) => {
    if (!profile) return;
    const apiCall = selectedGuest
      ? api(`/api/users/${profile.id}/guests/${selectedGuest.id}`, { method: 'PUT', body: JSON.stringify(values) })
      : api(`/api/users/${profile.id}/guests`, { method: 'POST', body: JSON.stringify(values) });
    try {
      await apiCall;
      toast.success(`Guest ${selectedGuest ? 'updated' : 'created'} successfully.`);
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(`Failed to ${selectedGuest ? 'update' : 'create'} guest.`);
    }
  };
  const handleDelete = async () => {
    if (!profile || !selectedGuest) return;
    try {
      await api(`/api/users/${profile.id}/guests/${selectedGuest.id}`, { method: 'DELETE' });
      toast.success("Guest deleted successfully.");
      fetchData();
      setIsDeleteDialogOpen(false);
      setSelectedGuest(null);
    } catch (error) {
      toast.error("Failed to delete guest.");
    }
  };
  const filteredGuests = useMemo(() => {
    if (groupFilter === "all") return guests;
    return guests.filter(g => g.group_id === groupFilter);
  }, [guests, groupFilter]);
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g.name])), [groups]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Guests</h1>
          <p className="text-muted-foreground">Manage your guest list.</p>
        </div>
        <Button onClick={() => handleModalOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Guest List</CardTitle>
          <CardDescription>A complete list of all your invited guests.</CardDescription>
          <div className="pt-4">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by group..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>
                      {guest.group_id && <Badge variant="secondary">{groupMap.get(guest.group_id) || 'N/A'}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={guest.is_sent ? "default" : "outline"}>
                        {guest.is_sent ? "Sent" : "Not Sent"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleModalOpen(guest)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteOpen(guest)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No guests found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGuest ? "Edit Guest" : "Add New Guest"}</DialogTitle>
            <DialogDescription>Enter the guest's details below.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="e.g., John Doe & Family" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 6281234567890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="group_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input placeholder="Optional notes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Guest</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the guest "{selectedGuest?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}