import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { requireAdmin } from '$lib/server/admin';
import { resetDisplayName } from '$lib/server/users';

const schema = z.object({ action: z.enum(['dismiss', 'reset_name']) });

// Resolves all open reports against one reported user at once.
export const POST: RequestHandler = async ({ request, params, locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	const { data, error } = await parseBody(request, schema);
	if (error) return error;

	const open = await db
		.select({ id: tables.nameReports.id })
		.from(tables.nameReports)
		.where(
			and(eq(tables.nameReports.reportedId, params.reportedId!), eq(tables.nameReports.status, 'open'))
		);
	if (open.length === 0) return apiError(404, 'NOT_FOUND');

	let newName: string | null = null;
	if (data.action === 'reset_name') newName = await resetDisplayName(params.reportedId!);

	await db
		.update(tables.nameReports)
		.set({
			status: data.action === 'dismiss' ? 'dismissed' : 'actioned',
			resolvedBy: locals.user!.id,
			resolvedAt: new Date()
		})
		.where(
			and(eq(tables.nameReports.reportedId, params.reportedId!), eq(tables.nameReports.status, 'open'))
		);
	return json({ ok: true, displayName: newName });
};
