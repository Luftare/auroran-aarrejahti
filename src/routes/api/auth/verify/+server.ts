import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { hashToken } from '$lib/server/auth/tokens';

const schema = z.object({ token: z.string().min(20).max(200) });

export const POST: RequestHandler = async ({ request }) => {
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	const rows = await db
		.select()
		.from(tables.emailTokens)
		.where(
			and(
				eq(tables.emailTokens.tokenHash, hashToken(data.token)),
				eq(tables.emailTokens.purpose, 'verify'),
				isNull(tables.emailTokens.usedAt)
			)
		);
	const token = rows[0];
	if (!token || token.expiresAt < new Date()) return apiError(400, 'TOKEN_INVALID');
	await db.transaction(async (tx) => {
		await tx
			.update(tables.emailTokens)
			.set({ usedAt: new Date() })
			.where(eq(tables.emailTokens.tokenHash, token.tokenHash));
		await tx
			.update(tables.users)
			.set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
			.where(eq(tables.users.id, token.userId));
	});
	return json({ ok: true });
};
