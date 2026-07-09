import { json, type RequestHandler } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { parseBody } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { helsinkiToday } from '$lib/server/time';

export const GET: RequestHandler = async ({ locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const points = await db.select().from(tables.spawnPoints).orderBy(asc(tables.spawnPoints.name));
	const todays = await db
		.select({ spawnPointId: tables.chests.spawnPointId, coinCount: tables.chests.coinCount })
		.from(tables.chests)
		.where(eq(tables.chests.day, helsinkiToday()));
	const todayByPoint = new Map(todays.map((c) => [c.spawnPointId, c.coinCount]));
	return json({
		points: points.map((p) => ({ ...p, todayCoinCount: todayByPoint.get(p.id) ?? null }))
	});
};

const createSchema = z.object({
	name: z.string().min(1).max(100),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	active: z.boolean().optional(),
	notes: z.string().max(1000).nullish()
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const { data, error } = await parseBody(request, createSchema);
	if (error) return error;
	const inserted = await db
		.insert(tables.spawnPoints)
		.values({ ...data, notes: data.notes ?? null, createdBy: locals.user!.id })
		.returning();
	return json({ point: inserted[0] }, { status: 201 });
};
