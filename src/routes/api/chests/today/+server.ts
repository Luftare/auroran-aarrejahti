import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { apiError } from '$lib/server/api';
import { ensureChestsForDay } from '$lib/server/game/spawn';
import { getSetting } from '$lib/server/settings';
import { helsinkiToday } from '$lib/server/time';

// Coin counts are deliberately not included — the reveal happens at the chest.
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	const today = helsinkiToday();
	await ensureChestsForDay(today); // self-heal if the midnight job was missed

	const rows = await db
		.select({
			id: tables.chests.id,
			lat: tables.spawnPoints.lat,
			lng: tables.spawnPoints.lng,
			lootId: tables.loots.id
		})
		.from(tables.chests)
		.innerJoin(tables.spawnPoints, eq(tables.chests.spawnPointId, tables.spawnPoints.id))
		.leftJoin(
			tables.loots,
			and(eq(tables.loots.chestId, tables.chests.id), eq(tables.loots.userId, locals.user.id))
		)
		.where(eq(tables.chests.day, today));

	return json({
		day: today,
		lootRadiusM: await getSetting('loot_radius_m'),
		chests: rows.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, looted: r.lootId != null }))
	});
};
