import { Hono } from "hono";
import type { Env } from './core-utils';
import type { ApiResponse } from '@shared/types';
import { UserEntity, ChatBoardEntity, MenuEntity, MenuState, MenuItem } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
// A simple in-memory store for demo purposes. In a real app, use a more robust solution.
const VALID_TOKENS = new Set<string>();
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FALLBACK_MENU_DATA: Record<string, { title: string; items: Omit<MenuItem, 'id'>[] }> = {
  especial: {
    title: "ESPECIAL",
    items: [
      { name: "Sancocho de 3 Carnes", price: 375 },
      { name: "Mondongo a la Criolla", price: 375 },
      { name: "Pati Mongó y Compañía", price: 350 },
    ],
  },
  platoDelDia: {
    title: "PLATO DEL DÍA",
    items: [
      { name: "Cerdo Guisado Criollo", price: 250 },
      { name: "Bistec Encebollado", price: 275 },
      { name: "Res Guisada Tradicional", price: 250 },
      { name: "Pollo Guisado Casero", price: 250 },
      { name: "Pollo Frito Crocante", price: 250 },
      { name: "Pollo al Horno Doradito", price: 250 },
      { name: "Pechurina Empanizada", price: 250 },
      { name: "Pechuga a la Plancha", price: 400 },
      { name: "Pechuga Salteada Vegetales", price: 400 },
      { name: "Pechuga a la Crema", price: 400 },
    ],
  },
  extras: {
    title: "EXTRAS",
    items: [
      { name: "Tostones", price: 100 },
      { name: "Arepita Maíz", price: 25 },
      { name: "Arepita Yuca", price: 25 },
      { name: "Batata Frita", price: 100 },
    ],
  },
  jugos: {
    title: "JUGOS",
    items: [
      { name: "Cereza", price: 100 },
      { name: "Limón", price: 100 },
      { name: "Chinola", price: 100 },
      { name: "Tamarindo", price: 100 },
    ],
  },
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // AUTH
  app.post('/api/auth', async (c) => {
    const { password } = (await c.req.json()) as { password?: string };
    if (password !== 'admin123') {
      return c.json({ success: false, error: 'Invalid credentials' } as ApiResponse, 401);
    }
    const token = crypto.randomUUID();
    VALID_TOKENS.add(token); // In a real app, you'd persist this with an expiry
    return ok(c, { token });
  });
  // MENU
  app.get('/api/menu', async (c) => {
    const menuEntity = new MenuEntity(c.env, 'global');
    let menu = await menuEntity.getState();
    // If menu is empty, seed it with fallback data for all days.
    if (!menu || !menu.days || Object.keys(menu.days).length === 0) {
      const seededMenu: MenuState = { days: {} };
      const menuTemplate: Record<string, MenuItem[]> = {};
      for (const [categoryKey, categoryData] of Object.entries(FALLBACK_MENU_DATA)) {
        menuTemplate[categoryKey] = categoryData.items.map(item => ({
          ...item,
          id: crypto.randomUUID(),
        }));
      }
      for (const day of DAYS) {
        // Create a deep copy with new UUIDs for each day to ensure unique items
        const dailyMenu: Record<string, MenuItem[]> = {};
        for (const [categoryKey, items] of Object.entries(menuTemplate)) {
            dailyMenu[categoryKey] = items.map(item => ({...item, id: crypto.randomUUID()}));
        }
        seededMenu.days[day] = dailyMenu;
      }
      menu = await menuEntity.mutate(() => seededMenu);
    }
    return ok(c, menu);
  });
  app.post('/api/menu', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Authorization required' } as ApiResponse, 401);
    }
    const token = auth.slice(7);
    if (!VALID_TOKENS.has(token)) {
        return c.json({ success: false, error: 'Invalid or expired token' } as ApiResponse, 401);
    }
    const body = await c.req.json<MenuState>();
    if (!body || typeof body.days !== 'object') {
      return bad(c, 'Invalid menu data provided');
    }
    const menuEntity = new MenuEntity(c.env, 'global');
    const updatedMenu = await menuEntity.mutate(() => body);
    return ok(c, updatedMenu);
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}