import { json, type RequestHandler } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin';
import { respawnToday } from '$lib/server/game/spawn';

export const POST: RequestHandler = async ({ locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const result = await respawnToday();
	// 409 when someone has already looted today — regeneration would orphan loots.
	if (!result.ok) return json({ ok: false }, { status: 409 });
	return json({ ok: true });
};
