import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth";
import type { GuestGroup } from "@shared/types";
const groupSchema = z.object({
  name: z.string().min(1, "Group name is required."),
  description: z.string().optional().nullable(),
  sort_order: z.number().default(0),
});
type GroupFormValues = z.infer<typeof groupSchema>;
export default function GroupsPage() {
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GuestGroup | null>(null);
  const profile = useAuthStore((state) => state.profile);
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "", sort_order: 0 },
  });
  const fetchGroups = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await api<GuestGroup[]>(`/api/users/${profile.id}/groups`);
      setGroups(data);
    } catch (error) {
      toast.error("Failed to fetch guest groups.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);
  const handleModalOpen = (group: GuestGroup | null = null) => {
    setSelectedGroup(group);
    if (group) {
      form.reset({ name: group.name, description: group.description || "", sort_order: group.sort_order });
    } else {
      form.reset({ name: "", description: "", sort_order: 0 });
    }
    setIsModalOpen(true);
  };
  const handleDeleteOpen = (group: GuestGroup) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };
  const onSubmit = async (values: GroupFormValues) => {
    if (!profile) return;
    const apiCall = selectedGroup
      ? api(`/api/users/${profile.id}/groups/${selectedGroup.id}`, { method: 'PUT', body: JSON.stringify(values) })
      : api(`/api/users/${profile.id}/groups`, { method: 'POST', body: JSON.stringify(values) });
    try {
      await apiCall;
      toast.success(`Group ${selectedGroup ? 'updated' : 'created'} successfully.`);
      fetchGroups();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(`Failed to ${selectedGroup ? 'update' : 'create'} group.`);
    }
  };
  const handleDelete = async () => {
    if (!profile || !selectedGroup) return;
    try {
      await api(`/api/users/${profile.id}/groups/${selectedGroup.id}`, { method: 'DELETE' });
      toast.success("Group deleted successfully.");
      fetchGroups();
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      toast.error("Failed to delete group.");
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Guest Groups</h1>
          <p className="text-muted-foreground">Organize your guests into different groups.</p>
        </div>
        <Button onClick={() => handleModalOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>Here is a list of your guest groups.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>{group.sort_order}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleModalOpen(group)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteOpen(group)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">No groups found. Create your first one!</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGroup ? "Edit Group" : "Create New Group"}</DialogTitle>
            <DialogDescription>Fill in the details for your guest group below.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl><Input placeholder="e.g., VIP, Family" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="A short description of the group" {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sort_order" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
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
              This action cannot be undone. This will permanently delete the "{selectedGroup?.name}" group.
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