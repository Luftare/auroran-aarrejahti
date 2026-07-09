import { json, type RequestHandler } from '@sveltejs/kit';
import { asc, count, eq, min } from 'drizzle-orm';
import { db, tables } from '$lib/server/db';
import { requireAdmin } from '$lib/server/admin';

export const GET: RequestHandler = async ({ locals }) => {
	const denied = requireAdmin(locals);
	if (denied) return denied;
	// Open reports grouped by reported user.
	const rows = await db
		.select({
			reportedId: tables.nameReports.reportedId,
			displayName: tables.users.displayName,
			reportCount: count(tables.nameReports.id),
			firstReportedAt: min(tables.nameReports.createdAt)
		})
		.from(tables.nameReports)
		.innerJoin(tables.users, eq(tables.nameReports.reportedId, tables.users.id))
		.where(eq(tables.nameReports.status, 'open'))
		.groupBy(tables.nameReports.reportedId, tables.users.displayName)
		.orderBy(asc(min(tables.nameReports.createdAt)));
	return json({ reports: rows });
};
