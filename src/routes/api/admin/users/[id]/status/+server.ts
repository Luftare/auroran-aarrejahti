import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { destroyAllSessions } from '$lib/server/auth/session';

const schema = z.object({ disabled: z.boolean() });

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	if (params.id === locals.user!.id) return apiError(400, 'INVALID_INPUT'); // no self-disable
	const updated = await db
		.update(tables.users)
		.set({ disabledAt: data.disabled ? new Date() : null, updatedAt: new Date() })
		.where(eq(tables.users.id, params.id!))
		.returning({ id: tables.users.id });
	if (updated.length === 0) return apiError(404, 'NOT_FOUND');
	if (data.disabled) await destroyAllSessions(params.id!);
	return json({ ok: true });
};
