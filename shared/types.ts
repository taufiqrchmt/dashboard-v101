export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type UserRole = 'admin' | 'user';
export type TemplateScope = 'global' | 'user';
export type SendChannel = 'whatsapp' | 'copy' | 'link';
export interface Profile {
  id: string; // uuid, references auth.users.id
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // timestamptz
}
export interface EventSetting {
  id: string; // uuid
  user_id: string; // uuid, FK -> profiles.id
  event_name: string;
  invitation_slug: string;
  invitation_url?: string | null;
  rsvp_url?: string | null;
  rsvp_password?: string | null;
  is_active: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}
export interface MessageTemplate {
  id: string; // uuid
  owner_user_id?: string | null; // uuid, FK -> profiles.id, null for global
  scope: TemplateScope;
  name: string;
  content_wa: string;
  content_copy: string;
  is_default: boolean;
  created_at: string; // timestamptz
}
export interface GuestGroup {
  id: string; // uuid
  user_id: string; // uuid, FK -> profiles.id
  name: string;
  description?: string | null;
  sort_order: number;
  created_at: string; // timestamptz
}
export interface Guest {
  id: string; // uuid
  user_id: string; // uuid, FK -> profiles.id
  group_id?: string | null; // uuid, FK -> guest_groups.id
  event_id?: string | null; // uuid, FK -> event_settings.id
  name: string;
  phone?: string | null;
  notes?: string | null;
  is_sent: boolean;
  last_sent_at?: string | null; // timestamptz
  created_at: string; // timestamptz
}
export interface SendLog {
  id: string; // uuid
  guest_id: string; // uuid, FK -> guests.id
  template_id: string; // uuid, FK -> message_templates.id
  channel: SendChannel;
  sent_by_user_id: string; // uuid, FK -> profiles.id
  sent_at: string; // timestamptz
}