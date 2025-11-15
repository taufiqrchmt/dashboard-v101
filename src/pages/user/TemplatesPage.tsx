import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth";
import type { MessageTemplate } from "@shared/types";
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required."),
  content_wa: z.string().min(1, "WhatsApp content is required."),
  content_copy: z.string().min(1, "Copyable text content is required."),
});
type TemplateFormValues = z.infer<typeof templateSchema>;
export default function UserTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const profile = useAuthStore((state) => state.profile);
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: "", content_wa: "", content_copy: "" },
  });
  const fetchTemplates = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const data = await api<MessageTemplate[]>(`/api/users/${profile.id}/templates`);
      setTemplates(data);
    } catch (error) {
      toast.error("Failed to fetch templates.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  const handleModalOpen = (template: MessageTemplate | null = null) => {
    setSelectedTemplate(template);
    if (template) {
      form.reset({ name: template.name, content_wa: template.content_wa, content_copy: template.content_copy });
    } else {
      form.reset({ name: "", content_wa: "", content_copy: "" });
    }
    setIsModalOpen(true);
  };
  const handleDeleteOpen = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };
  const onSubmit = async (values: TemplateFormValues) => {
    if (!profile) return;
    const apiCall = selectedTemplate
      ? api(`/api/users/${profile.id}/templates/${selectedTemplate.id}`, { method: 'PUT', body: JSON.stringify(values) })
      : api(`/api/users/${profile.id}/templates`, { method: 'POST', body: JSON.stringify(values) });
    try {
      await apiCall;
      toast.success(`Template ${selectedTemplate ? 'updated' : 'created'} successfully.`);
      fetchTemplates();
      setIsModalOpen(false);
    } catch (error) {
      toast.error(`Failed to ${selectedTemplate ? 'update' : 'create'} template.`);
    }
  };
  const handleDelete = async () => {
    if (!profile || !selectedTemplate) return;
    try {
      await api(`/api/users/${profile.id}/templates/${selectedTemplate.id}`, { method: 'DELETE' });
      toast.success("Template deleted successfully.");
      fetchTemplates();
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error("Failed to delete template.");
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground">Create and manage your invitation messages.</p>
        </div>
        <Button onClick={() => handleModalOpen()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)
        ) : templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {template.is_default && <Badge>Default</Badge>}
                    <Badge variant={template.scope === 'global' ? 'secondary' : 'outline'}>
                      {template.scope === 'global' ? 'Global' : 'My Template'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-slate-100 dark:bg-slate-800 p-4 rounded-md h-32 overflow-y-auto">
                  {template.content_wa}
                </p>
                {template.scope === 'user' && (
                  <div className="text-right mt-4 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleModalOpen(template)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteOpen(template)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground col-span-2 text-center">No templates found.</p>
        )}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>Design your message for WhatsApp and plain text.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Formal Invitation" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content_wa" render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Content</FormLabel>
                  <FormControl><Textarea placeholder="Use [nama-tamu] and [link-undangan] as placeholders." {...field} rows={8} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content_copy" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plain Text Content</FormLabel>
                  <FormControl><Textarea placeholder="Content for copying to clipboard." {...field} rows={8} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Template</Button>
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
              This will permanently delete the "{selectedTemplate?.name}" template. This action cannot be undone.
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