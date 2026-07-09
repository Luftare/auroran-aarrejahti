import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { rateLimit } from '$lib/server/ratelimit';

const schema = z.object({ reportedUserId: z.string().uuid() });

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	if (!rateLimit(`report:${locals.user.id}`, 5)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	if (data.reportedUserId === locals.user.id) return apiError(400, 'INVALID_INPUT');

	const target = await db
		.select({ id: tables.users.id })
		.from(tables.users)
		.where(eq(tables.users.id, data.reportedUserId));
	if (target.length === 0) return apiError(404, 'NOT_FOUND');

	// Duplicate open reports from the same reporter are idempotent successes.
	const existing = await db
		.select({ id: tables.nameReports.id })
		.from(tables.nameReports)
		.where(
			and(
				eq(tables.nameReports.reporterId, locals.user.id),
				eq(tables.nameReports.reportedId, data.reportedUserId),
				eq(tables.nameReports.status, 'open')
			)
		);
	if (existing.length === 0) {
		await db
			.insert(tables.nameReports)
			.values({ reporterId: locals.user.id, reportedId: data.reportedUserId });
	}
	return json({ ok: true });
};
