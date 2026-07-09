import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { hashPassword, passwordProblem, verifyPassword } from '$lib/server/auth/password';
import { displayNameProblem, nameTaken } from '$lib/server/users';
import { mePayload } from '$lib/server/me';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	return json({ user: await mePayload(locals.user.id) });
};

const schema = z.object({
	displayName: z.string().min(1).max(40).optional(),
	currentPassword: z.string().max(200).optional(),
	newPassword: z.string().max(200).optional()
});

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	if (locals.user.kind !== 'registered') return apiError(403, 'GHOST_ONLY');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;

	const updates: Partial<typeof tables.users.$inferInsert> = {};

	if (data.displayName !== undefined) {
		const name = data.displayName.trim();
		const problem = displayNameProblem(name);
		if (problem) return apiError(400, problem);
		if (await nameTaken(name, locals.user.id)) return apiError(409, 'NAME_TAKEN');
		updates.displayName = name;
	}

	if (data.newPassword !== undefined) {
		const rows = await db.select().from(tables.users).where(eq(tables.users.id, locals.user.id));
		const hash = rows[0]?.passwordHash;
		if (!hash || !data.currentPassword || !(await verifyPassword(hash, data.currentPassword))) {
			return apiError(400, 'WRONG_PASSWORD');
		}
		const problem = passwordProblem(data.newPassword);
		if (problem) return apiError(400, problem);
		updates.passwordHash = await hashPassword(data.newPassword);
	}

	if (Object.keys(updates).length > 0) {
		await db
			.update(tables.users)
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(tables.users.id, locals.user.id));
	}
	return json({ user: await mePayload(locals.user.id) });
};
