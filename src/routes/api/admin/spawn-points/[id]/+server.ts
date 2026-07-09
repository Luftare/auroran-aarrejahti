import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';

const patchSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional(),
	active: z.boolean().optional(),
	notes: z.string().max(1000).nullish()
});

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const { data, error } = await parseBody(request, patchSchema);
	if (error) return error;
	const updated = await db
		.update(tables.spawnPoints)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(tables.spawnPoints.id, params.id!))
		.returning();
	if (updated.length === 0) return apiError(404, 'NOT_FOUND');
	return json({ point: updated[0] });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	// Deletable only when never used by a chest; otherwise deactivate instead.
	const used = await db
		.select({ id: tables.chests.id })
		.from(tables.chests)
		.where(eq(tables.chests.spawnPointId, params.id!));
	if (used.length > 0) {
		await db
			.update(tables.spawnPoints)
			.set({ active: false, updatedAt: new Date() })
			.where(eq(tables.spawnPoints.id, params.id!));
		return json({ deactivated: true });
	}
	await db.delete(tables.spawnPoints).where(eq(tables.spawnPoints.id, params.id!));
	return json({ deleted: true });
};
