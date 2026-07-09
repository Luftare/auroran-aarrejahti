import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { parseBody } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { getAllSettings, setSetting } from '$lib/server/settings';

export const GET: RequestHandler = async ({ locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	return json({ settings: await getAllSettings() });
};

const schema = z.object({
	daily_chest_count: z.number().int().min(1).max(50).optional(),
	loot_radius_m: z.number().int().min(5).max(200).optional()
});

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	if (data.daily_chest_count !== undefined) await setSetting('daily_chest_count', data.daily_chest_count);
	if (data.loot_radius_m !== undefined) await setSetting('loot_radius_m', data.loot_radius_m);
	return json({ settings: await getAllSettings() });
};
