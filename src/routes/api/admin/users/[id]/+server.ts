import { json, type RequestHandler } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { apiError } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { coinBalance } from '$lib/server/users';

export const GET: RequestHandler = async ({ params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const users = await db.select().from(tables.users).where(eq(tables.users.id, params.id!));
	const user = users[0];
	if (!user) return apiError(404, 'NOT_FOUND');

	const recentLoots = await db
		.select({
			lootedAt: tables.loots.lootedAt,
			lat: tables.loots.lat,
			lng: tables.loots.lng,
			accuracyM: tables.loots.accuracyM,
			coinCount: tables.chests.coinCount,
			pointName: tables.spawnPoints.name
		})
		.from(tables.loots)
		.innerJoin(tables.chests, eq(tables.loots.chestId, tables.chests.id))
		.innerJoin(tables.spawnPoints, eq(tables.chests.spawnPointId, tables.spawnPoints.id))
		.where(eq(tables.loots.userId, user.id))
		.orderBy(desc(tables.loots.lootedAt))
		.limit(50);

	const ledger = await db
		.select()
		.from(tables.coinTransactions)
		.where(eq(tables.coinTransactions.userId, user.id))
		.orderBy(desc(tables.coinTransactions.createdAt))
		.limit(100);

	const { passwordHash: _, ...safeUser } = user;
	return json({ user: safeUser, coins: await coinBalance(user.id), recentLoots, ledger });
};
