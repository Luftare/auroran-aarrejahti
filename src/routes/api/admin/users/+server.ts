import { json, type RequestHandler } from '@sveltejs/kit';
import { count, desc, eq, sql } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { requireAdmin } from '$lib/server/admin';

export const GET: RequestHandler = async ({ locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const rows = await db
		.select({
			id: tables.users.id,
			kind: tables.users.kind,
			displayName: tables.users.displayName,
			email: tables.users.email,
			emailVerifiedAt: tables.users.emailVerifiedAt,
			isAdmin: tables.users.isAdmin,
			streakCurrent: tables.users.streakCurrent,
			createdAt: tables.users.createdAt,
			disabledAt: tables.users.disabledAt,
			loots: count(tables.loots.id),
			coins: sql<string>`coalesce((select sum(t.amount) from coin_transactions t where t.user_id = ${tables.users.id}), 0)`
		})
		.from(tables.users)
		.leftJoin(tables.loots, eq(tables.loots.userId, tables.users.id))
		.groupBy(tables.users.id)
		.orderBy(desc(tables.users.createdAt));
	return json({ users: rows.map((r) => ({ ...r, coins: Number(r.coins) })) });
};
