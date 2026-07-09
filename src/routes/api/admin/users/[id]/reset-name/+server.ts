import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { apiError } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { resetDisplayName } from '$lib/server/users';

export const POST: RequestHandler = async ({ params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const users = await db
		.select({ id: tables.users.id })
		.from(tables.users)
		.where(eq(tables.users.id, params.id!));
	if (users.length === 0) return apiError(404, 'NOT_FOUND');
	const newName = await resetDisplayName(params.id!);
	return json({ displayName: newName });
};
