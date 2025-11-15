import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from './core-utils';
import { ProfileEntity, EventSettingEntity, MessageTemplateEntity, GuestGroupEntity, GuestEntity, SendLogEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Guest, GuestGroup, MessageTemplate, SendLog, Profile, EventSetting } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Ensure all seed data is present on first load
  app.use('/api/*', async (c, next) => {
    await Promise.all([
      ProfileEntity.ensureSeed(c.env),
      EventSettingEntity.ensureSeed(c.env),
      MessageTemplateEntity.ensureSeed(c.env),
      GuestGroupEntity.ensureSeed(c.env),
      GuestEntity.ensureSeed(c.env),
      SendLogEntity.ensureSeed(c.env),
    ]);
    await next();
  });
  // AUTH
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string, password?: string }>();
    let effectiveEmail = email;
    if (email === 'admin') {
      effectiveEmail = 'admin@example.com';
    }
    if (!effectiveEmail) {
      return bad(c, 'Email is required');
    }
    const profileEntity = new ProfileEntity(c.env, effectiveEmail);
    if (!(await profileEntity.exists())) {
      return notFound(c, 'Invalid credentials');
    }
    const profile = await profileEntity.getState();
    if (profile.role === 'admin' && password !== '#m4rjinaL') {
      return bad(c, 'Invalid credentials');
    }
    return ok(c, profile);
  });
  // --- USER-FACING ROUTES ---
  // EVENT SETTINGS (for a specific user)
  app.get('/api/users/:userId/event-settings', async (c) => {
    const userId = c.req.param('userId');
    const { items } = await EventSettingEntity.list(c.env);
    const userSettings = items.find(item => item.user_id === userId);
    if (!userSettings) {
      return notFound(c, 'Event settings not found for this user.');
    }
    return ok(c, userSettings);
  });
  // TEMPLATES (for a specific user + global)
  app.get('/api/users/:userId/templates', async (c) => {
    const userId = c.req.param('userId');
    const { items } = await MessageTemplateEntity.list(c.env);
    const userTemplates = items.filter(t => t.scope === 'global' || t.owner_user_id === userId);
    return ok(c, userTemplates);
  });
  const templateCreateSchema = z.object({
    name: z.string().min(1),
    content_wa: z.string(),
    content_copy: z.string(),
    is_default: z.boolean().optional(),
  });
  app.post('/api/users/:userId/templates', zValidator('json', templateCreateSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      owner_user_id: userId,
      scope: 'user',
      name: body.name,
      content_wa: body.content_wa,
      content_copy: body.content_copy,
      is_default: body.is_default ?? false,
      created_at: new Date().toISOString(),
    };
    await MessageTemplateEntity.create(c.env, newTemplate);
    return ok(c, newTemplate);
  });
  app.put('/api/users/:userId/templates/:templateId', zValidator('json', templateCreateSchema), async (c) => {
    const { userId, templateId } = c.req.param();
    const body = c.req.valid('json');
    const entity = new MessageTemplateEntity(c.env, templateId);
    if (!(await entity.exists())) return notFound(c, 'Template not found');
    const current = await entity.getState();
    if (current.owner_user_id !== userId || current.scope !== 'user') return bad(c, 'Permission denied');
    const updatedTemplate: MessageTemplate = {
      ...current,
      name: body.name,
      content_wa: body.content_wa,
      content_copy: body.content_copy,
      is_default: body.is_default ?? current.is_default,
    };
    await entity.save(updatedTemplate);
    return ok(c, updatedTemplate);
  });
  app.delete('/api/users/:userId/templates/:templateId', async (c) => {
    const { userId, templateId } = c.req.param();
    const entity = new MessageTemplateEntity(c.env, templateId);
    if (!(await entity.exists())) return notFound(c, 'Template not found');
    const current = await entity.getState();
    if (current.owner_user_id !== userId || current.scope !== 'user') return bad(c, 'Permission denied');
    await MessageTemplateEntity.delete(c.env, templateId);
    return ok(c, { id: templateId });
  });
  // GUEST GROUPS (for a specific user)
  app.get('/api/users/:userId/groups', async (c) => {
    const userId = c.req.param('userId');
    const { items } = await GuestGroupEntity.list(c.env);
    const userGroups = items.filter(g => g.user_id === userId).sort((a, b) => a.sort_order - b.sort_order);
    return ok(c, userGroups);
  });
  const groupSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    sort_order: z.number().optional(),
  });
  app.post('/api/users/:userId/groups', zValidator('json', groupSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const newGroup: GuestGroup = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: body.name,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      created_at: new Date().toISOString(),
    };
    await GuestGroupEntity.create(c.env, newGroup);
    return ok(c, newGroup);
  });
  app.put('/api/users/:userId/groups/:groupId', zValidator('json', groupSchema), async (c) => {
    const { userId, groupId } = c.req.param();
    const body = c.req.valid('json');
    const entity = new GuestGroupEntity(c.env, groupId);
    if (!(await entity.exists())) return notFound(c, 'Group not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Permission denied');
    const updatedGroup: GuestGroup = {
      ...current,
      name: body.name,
      description: body.description ?? current.description,
      sort_order: body.sort_order ?? current.sort_order,
    };
    await entity.save(updatedGroup);
    return ok(c, updatedGroup);
  });
  app.delete('/api/users/:userId/groups/:groupId', async (c) => {
    const { userId, groupId } = c.req.param();
    const entity = new GuestGroupEntity(c.env, groupId);
    if (!(await entity.exists())) return notFound(c, 'Group not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Permission denied');
    await GuestGroupEntity.delete(c.env, groupId);
    return ok(c, { id: groupId });
  });
  // GUESTS (for a specific user)
  app.get('/api/users/:userId/guests', async (c) => {
    const userId = c.req.param('userId');
    const { items } = await GuestEntity.list(c.env);
    const userGuests = items.filter(g => g.user_id === userId);
    return ok(c, userGuests);
  });
  const guestSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    group_id: z.string().optional(),
    notes: z.string().optional(),
  });
  app.post('/api/users/:userId/guests', zValidator('json', guestSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const newGuest: Guest = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: body.name,
      phone: body.phone ?? null,
      group_id: body.group_id ?? null,
      notes: body.notes ?? null,
      is_sent: false,
      last_sent_at: null,
      created_at: new Date().toISOString(),
    };
    await GuestEntity.create(c.env, newGuest);
    return ok(c, newGuest);
  });
  app.put('/api/users/:userId/guests/:guestId', zValidator('json', guestSchema), async (c) => {
    const { userId, guestId } = c.req.param();
    const body = c.req.valid('json');
    const entity = new GuestEntity(c.env, guestId);
    if (!(await entity.exists())) return notFound(c, 'Guest not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Permission denied');
    const updatedGuest: Guest = {
      ...current,
      name: body.name,
      phone: body.phone ?? current.phone,
      group_id: body.group_id ?? current.group_id,
      notes: body.notes ?? current.notes,
    };
    await entity.save(updatedGuest);
    return ok(c, updatedGuest);
  });
  app.delete('/api/users/:userId/guests/:guestId', async (c) => {
    const { userId, guestId } = c.req.param();
    const entity = new GuestEntity(c.env, guestId);
    if (!(await entity.exists())) return notFound(c, 'Guest not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Permission denied');
    await GuestEntity.delete(c.env, guestId);
    return ok(c, { id: guestId });
  });
  // SENDING LOGIC
  const sendStatusSchema = z.object({ is_sent: z.boolean() });
  app.put('/api/users/:userId/guests/:guestId/send-status', zValidator('json', sendStatusSchema), async (c) => {
    const { userId, guestId } = c.req.param();
    const { is_sent } = c.req.valid('json');
    const entity = new GuestEntity(c.env, guestId);
    if (!(await entity.exists())) return notFound(c, 'Guest not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Permission denied');
    const updatedGuest: Guest = {
      ...current,
      is_sent,
      last_sent_at: is_sent ? new Date().toISOString() : null,
    };
    await entity.save(updatedGuest);
    return ok(c, updatedGuest);
  });
  const sendLogSchema = z.object({
    guest_id: z.string(),
    template_id: z.string(),
    channel: z.enum(['whatsapp', 'copy', 'link']),
  });
  app.post('/api/users/:userId/send-logs', zValidator('json', sendLogSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const newLog: SendLog = {
      id: crypto.randomUUID(),
      guest_id: body.guest_id,
      template_id: body.template_id,
      channel: body.channel,
      sent_by_user_id: userId,
      sent_at: new Date().toISOString(),
    };
    await SendLogEntity.create(c.env, newLog);
    return ok(c, newLog);
  });
  // --- ADMIN ROUTES ---
  // USER MANAGEMENT
  app.get('/api/admin/users', async (c) => {
    const { items } = await ProfileEntity.list(c.env);
    return ok(c, items);
  });
  const userCreateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['admin', 'user']),
  });
  app.post('/api/admin/users', zValidator('json', userCreateSchema), async (c) => {
    const body = c.req.valid('json');
    const existing = new ProfileEntity(c.env, body.email);
    if (await existing.exists()) return bad(c, 'User with this email already exists.');
    const newUser: Profile = {
      id: crypto.randomUUID(),
      name: body.name,
      email: body.email,
      role: body.role,
      created_at: new Date().toISOString(),
    };
    await ProfileEntity.create(c.env, newUser);
    return ok(c, newUser);
  });
  const userUpdateSchema = z.object({
    name: z.string().min(1),
    role: z.enum(['admin', 'user']),
  });
  app.put('/api/admin/users/:userId', zValidator('json', userUpdateSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const { items: profiles } = await ProfileEntity.list(c.env);
    const profile = profiles.find(p => p.id === userId);
    if (!profile) return notFound(c, 'User not found');
    const entity = new ProfileEntity(c.env, profile.email);
    const updatedProfile: Profile = { ...profile, name: body.name, role: body.role };
    await entity.save(updatedProfile);
    return ok(c, updatedProfile);
  });
  // GLOBAL TEMPLATES
  app.get('/api/admin/templates', async (c) => {
    const { items } = await MessageTemplateEntity.list(c.env);
    return ok(c, items.filter(t => t.scope === 'global'));
  });
  app.post('/api/admin/templates', zValidator('json', templateCreateSchema), async (c) => {
    const body = c.req.valid('json');
    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      owner_user_id: null,
      scope: 'global',
      name: body.name,
      content_wa: body.content_wa,
      content_copy: body.content_copy,
      is_default: body.is_default ?? false,
      created_at: new Date().toISOString(),
    };
    await MessageTemplateEntity.create(c.env, newTemplate);
    return ok(c, newTemplate);
  });
  app.put('/api/admin/templates/:templateId', zValidator('json', templateCreateSchema), async (c) => {
    const templateId = c.req.param('templateId');
    const body = c.req.valid('json');
    const entity = new MessageTemplateEntity(c.env, templateId);
    if (!(await entity.exists())) return notFound(c, 'Template not found');
    const current = await entity.getState();
    if (current.scope !== 'global') return bad(c, 'Permission denied');
    const updatedTemplate: MessageTemplate = { ...current, ...body };
    await entity.save(updatedTemplate);
    return ok(c, updatedTemplate);
  });
  app.delete('/api/admin/templates/:templateId', async (c) => {
    const templateId = c.req.param('templateId');
    const entity = new MessageTemplateEntity(c.env, templateId);
    if (!(await entity.exists())) return notFound(c, 'Template not found');
    const current = await entity.getState();
    if (current.scope !== 'global') return bad(c, 'Permission denied');
    await MessageTemplateEntity.delete(c.env, templateId);
    return ok(c, { id: templateId });
  });
  // EVENT SETTINGS MANAGEMENT
  const eventSettingSchema = z.object({
    event_name: z.string().min(1),
    invitation_slug: z.string().min(1),
    invitation_url: z.string().optional().nullable(),
    rsvp_url: z.string().optional().nullable(),
    rsvp_password: z.string().optional().nullable(),
    is_active: z.boolean(),
  });
  app.post('/api/admin/users/:userId/event-settings', zValidator('json', eventSettingSchema), async (c) => {
    const userId = c.req.param('userId');
    const body = c.req.valid('json');
    const newSetting: EventSetting = {
      id: crypto.randomUUID(),
      user_id: userId,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await EventSettingEntity.create(c.env, newSetting);
    return ok(c, newSetting);
  });
  app.put('/api/admin/users/:userId/event-settings/:settingId', zValidator('json', eventSettingSchema), async (c) => {
    const { userId, settingId } = c.req.param();
    const body = c.req.valid('json');
    const entity = new EventSettingEntity(c.env, settingId);
    if (!(await entity.exists())) return notFound(c, 'Setting not found');
    const current = await entity.getState();
    if (current.user_id !== userId) return bad(c, 'Mismatched user for this setting');
    const updatedSetting: EventSetting = {
      ...current,
      ...body,
      updated_at: new Date().toISOString(),
    };
    await entity.save(updatedSetting);
    return ok(c, updatedSetting);
  });
  // ADMIN STATS
  app.get('/api/admin/stats/guests', async (c) => {
    const { items } = await GuestEntity.list(c.env);
    return ok(c, { count: items.length });
  });
  app.get('/api/admin/stats/events', async (c) => {
    const { items } = await EventSettingEntity.list(c.env);
    const activeEvents = items.filter(e => e.is_active).length;
    return ok(c, { count: activeEvents });
  });
}