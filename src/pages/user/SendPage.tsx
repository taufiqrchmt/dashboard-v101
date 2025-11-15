import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Link, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth";
import type { Guest, GuestGroup, MessageTemplate, EventSetting, SendChannel } from "@shared/types";
interface GeneratedInvitation {
  guest: Guest;
  final_invitation_url: string;
  generated_wa_text: string;
  generated_copy_text: string;
  wa_link: string;
}
export default function SendPage() {
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [eventSetting, setEventSetting] = useState<EventSetting | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [generatedList, setGeneratedList] = useState<GeneratedInvitation[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const fetchData = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const [groupsData, templatesData, eventSettingData] = await Promise.all([
        api<GuestGroup[]>(`/api/users/${profile.id}/groups`),
        api<MessageTemplate[]>(`/api/users/${profile.id}/templates`),
        api<EventSetting>(`/api/users/${profile.id}/event-settings`),
      ]);
      setGroups(groupsData);
      setTemplates(templatesData);
      setEventSetting(eventSettingData);
      const defaultTemplate = templatesData.find(t => t.is_default);
      if (defaultTemplate) setSelectedTemplateId(defaultTemplate.id);
    } catch (error) {
      toast.error("Failed to load necessary data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [profile]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleGenerate = async () => {
    if (!profile || !selectedGroupId || !selectedTemplateId || !eventSetting) {
      toast.warning("Please select a group and a template.");
      return;
    }
    setIsGenerating(true);
    try {
      const guestsData = await api<Guest[]>(`/api/users/${profile.id}/guests`);
      const filteredGuests = guestsData.filter(g => g.group_id === selectedGroupId);
      setGuests(filteredGuests);
      const template = templates.find(t => t.id === selectedTemplateId);
      if (!template) {
        toast.error("Selected template not found.");
        return;
      }
      const generated = filteredGuests.map(guest => {
        const guest_name = guest.name;
        const base_url = eventSetting.invitation_url || `https://app.inviteable.id/${eventSetting.invitation_slug}/`;
        const final_invitation_url = `${base_url}?to=${encodeURIComponent(guest_name)}`;
        const generated_wa_text = template.content_wa.replace(/\[nama-tamu\]/g, guest_name).replace(/\[link-undangan\]/g, final_invitation_url);
        const generated_copy_text = template.content_copy.replace(/\[nama-tamu\]/g, guest_name).replace(/\[link-undangan\]/g, final_invitation_url);
        const phone_clean = guest.phone?.replace(/[^0-9]/g, '') || '';
        const wa_link = `https://wa.me/${phone_clean}?text=${encodeURIComponent(generated_wa_text)}`;
        return { guest, final_invitation_url, generated_wa_text, generated_copy_text, wa_link };
      });
      setGeneratedList(generated);
    } catch (error) {
      toast.error("Failed to generate invitations.");
    } finally {
      setIsGenerating(false);
    }
  };
  const updateGuestSentStatus = async (guestId: string, is_sent: boolean) => {
    if (!profile) return;
    try {
      await api(`/api/users/${profile.id}/guests/${guestId}/send-status`, {
        method: 'PUT',
        body: JSON.stringify({ is_sent }),
      });
      setGeneratedList(prev => prev.map(item => item.guest.id === guestId ? { ...item, guest: { ...item.guest, is_sent } } : item));
      toast.success(`Guest status updated.`);
    } catch (error) {
      toast.error("Failed to update guest status.");
    }
  };
  const handleAction = async (guestId: string, channel: SendChannel) => {
    if (!profile || !selectedTemplateId) return;
    updateGuestSentStatus(guestId, true);
    try {
      await api(`/api/users/${profile.id}/send-logs`, {
        method: 'POST',
        body: JSON.stringify({ guest_id: guestId, template_id: selectedTemplateId, channel }),
      });
    } catch (error) {
      toast.error("Failed to log sending action.");
    }
  };
  const handleCopy = (text: string, guestId: string, channel: SendChannel) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    handleAction(guestId, channel);
  };
  const handleWhatsApp = (link: string, guestId: string) => {
    window.open(link, '_blank');
    handleAction(guestId, 'whatsapp');
  };
  const groupMap = useMemo(() => new Map(groups.map(g => [g.id, g.name])), [groups]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Send Invitations</h1>
        <p className="text-muted-foreground">Generate and send personalized invitations to your guests.</p>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Select a group and a template to generate invitations.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Guest Group</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
              <SelectContent>
                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message Template</label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isLoading}>
              <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
              <SelectContent>
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.scope})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="self-end">
            <Button className="w-full" onClick={handleGenerate} disabled={isGenerating || isLoading || !selectedGroupId || !selectedTemplateId}>
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Generated Invitations</CardTitle>
          <CardDescription>Review and send the generated invitations below.</CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : generatedList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedList.map(item => (
                  <TableRow key={item.guest.id}>
                    <TableCell>
                      <Checkbox
                        checked={item.guest.is_sent}
                        onCheckedChange={(checked) => updateGuestSentStatus(item.guest.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.guest.name}</TableCell>
                    <TableCell>
                      {item.guest.group_id && <Badge variant="secondary">{groupMap.get(item.guest.group_id)}</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleWhatsApp(item.wa_link, item.guest.id)} disabled={!item.guest.phone}><MessageCircle className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => handleCopy(item.generated_copy_text, item.guest.id, 'copy')}><Copy className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" onClick={() => handleCopy(item.final_invitation_url, item.guest.id, 'link')}><Link className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Select a group and template, then click "Generate" to see the list of invitations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}