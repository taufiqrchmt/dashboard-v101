import { IndexedEntity } from "./core-utils";
import type { Profile, EventSetting, MessageTemplate, GuestGroup, Guest, SendLog } from "@shared/types";
// --- SEED DATA ---
const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '00000000-0000-0000-0000-000000000002';
const USER_ID_2 = '00000000-0000-0000-0000-000000000003';
const EVENT_ID = 'e0000000-0000-0000-0000-000000000001';
const SEED_PROFILES: Profile[] = [
  { id: ADMIN_ID, name: 'Admin User', email: 'admin@example.com', role: 'admin', created_at: new Date().toISOString() },
  { id: USER_ID, name: 'Fathia & Saverro', email: 'user@example.com', role: 'user', created_at: new Date().toISOString() },
  { id: USER_ID_2, name: 'John Doe', email: 'john.doe@example.com', role: 'user', created_at: new Date().toISOString() },
];
const SEED_EVENT_SETTINGS: EventSetting[] = [
  {
    id: EVENT_ID,
    user_id: USER_ID,
    event_name: 'The Wedding of Fathia & Saverro',
    invitation_slug: 'fathia-saverro',
    invitation_url: null,
    rsvp_url: 'https://example.com/rsvp',
    rsvp_password: 'rsvp',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];
const SEED_GLOBAL_TEMPLATE_ID = 'gt000000-0000-0000-0000-000000000001';
const SEED_USER_TEMPLATE_ID = 'ut000000-0000-0000-0000-000000000001';
const SEED_TEMPLATES: MessageTemplate[] = [
  {
    id: SEED_GLOBAL_TEMPLATE_ID,
    owner_user_id: null,
    scope: 'global',
    name: 'Default Wedding Invitation',
    content_wa: `*💌 Wedding Invitation*\n\nTo: *[nama-tamu]*\n\nWith our deepest respect and joy, we would be truly honored to invite you to be a part of our wedding day celebration:\n\nFor complete details about the event, please visit our invitation link:\n\n[link-undangan]\n\n_For optimal viewing, please open the link in Safari/Chrome._\n\nYour presence and blessings would mean the world to us.\n\nExcited to see you on our special day!\n\nWith love,\n*Fathia & Saverro*`,
    content_copy: `💌 Wedding Invitation\n\nTo: [nama-tamu]\n\nWith our deepest respect and joy, we would be truly honored to invite you to be a part of our wedding day celebration:\n\nFor complete details about the event, please visit our invitation link:\n\n[link-undangan]\n\nFor optimal viewing, please open the link in Safari/Chrome.\n\nYour presence and blessings would mean the world to us.\n\nExcited to see you on our special day!\n\nWith love,\nFathia & Saverro`,
    is_default: true,
    created_at: new Date().toISOString(),
  },
  {
    id: SEED_USER_TEMPLATE_ID,
    owner_user_id: USER_ID,
    scope: 'user',
    name: 'Casual Invite (Friends)',
    content_wa: `Hey [nama-tamu]! 👋\n\nWe're getting married! Come celebrate with us.\n\nAll the details are here: [link-undangan]\n\nCan't wait to see you!\n\nFathia & Saverro`,
    content_copy: `Hey [nama-tamu]! 👋\n\nWe're getting married! Come celebrate with us.\n\nAll the details are here: [link-undangan]\n\nCan't wait to see you!\n\nFathia & Saverro`,
    is_default: false,
    created_at: new Date().toISOString(),
  }
];
const GROUP_ID_VIP = 'gg000000-0000-0000-0000-000000000001';
const GROUP_ID_FAMILY = 'gg000000-0000-0000-0000-000000000002';
const SEED_GROUPS: GuestGroup[] = [
  { id: GROUP_ID_VIP, user_id: USER_ID, name: 'VIP', description: 'Very Important People', sort_order: 1, created_at: new Date().toISOString() },
  { id: GROUP_ID_FAMILY, user_id: USER_ID, name: 'Keluarga', description: 'Family members', sort_order: 2, created_at: new Date().toISOString() },
];
const SEED_GUESTS: Guest[] = [
  { id: crypto.randomUUID(), user_id: USER_ID, group_id: GROUP_ID_VIP, event_id: EVENT_ID, name: 'Linda & Keluarga', phone: '6281234567890', notes: 'Close friend', is_sent: true, last_sent_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: crypto.randomUUID(), user_id: USER_ID, group_id: GROUP_ID_FAMILY, event_id: EVENT_ID, name: 'Budi Santoso', phone: '6281234567891', notes: '', is_sent: false, last_sent_at: null, created_at: new Date().toISOString() },
];
// --- ENTITIES ---
export class ProfileEntity extends IndexedEntity<Profile> {
  static readonly entityName = "profile";
  static readonly indexName = "profiles";
  static readonly initialState: Profile = { id: "", name: "", email: "", role: 'user', created_at: "" };
  static seedData = SEED_PROFILES;
  static keyOf = (state: Profile) => state.email; // Use email as unique key for login
}
export class EventSettingEntity extends IndexedEntity<EventSetting> {
  static readonly entityName = "event_setting";
  static readonly indexName = "event_settings";
  static readonly initialState: EventSetting = { id: "", user_id: "", event_name: "", invitation_slug: "", is_active: false, created_at: "", updated_at: "" };
  static seedData = SEED_EVENT_SETTINGS;
}
export class MessageTemplateEntity extends IndexedEntity<MessageTemplate> {
  static readonly entityName = "message_template";
  static readonly indexName = "message_templates";
  static readonly initialState: MessageTemplate = { id: "", scope: 'user', name: "", content_wa: "", content_copy: "", is_default: false, created_at: "" };
  static seedData = SEED_TEMPLATES;
}
export class GuestGroupEntity extends IndexedEntity<GuestGroup> {
  static readonly entityName = "guest_group";
  static readonly indexName = "guest_groups";
  static readonly initialState: GuestGroup = { id: "", user_id: "", name: "", sort_order: 0, created_at: "" };
  static seedData = SEED_GROUPS;
}
export class GuestEntity extends IndexedEntity<Guest> {
  static readonly entityName = "guest";
  static readonly indexName = "guests";
  static readonly initialState: Guest = { id: "", user_id: "", name: "", is_sent: false, created_at: "" };
  static seedData = SEED_GUESTS;
}
export class SendLogEntity extends IndexedEntity<SendLog> {
  static readonly entityName = "send_log";
  static readonly indexName = "send_logs";
  static readonly initialState: SendLog = { id: "", guest_id: "", template_id: "", channel: 'copy', sent_by_user_id: "", sent_at: "" };
}