import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { generateToken, hashToken } from '$lib/server/auth/tokens';
import { sendPasswordResetEmail } from '$lib/server/auth/email';
import { rateLimit } from '$lib/server/ratelimit';
import { findUserByEmail } from '$lib/server/users';

const schema = z.object({ email: z.string().email().max(200) });

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (!rateLimit(`reset-req:${getClientAddress()}`, 3)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	const user = await findUserByEmail(data.email);
	// Uniform response regardless of whether the account exists.
	if (user?.email && !user.disabledAt) {
		const token = generateToken();
		await db.insert(tables.emailTokens).values({
			tokenHash: hashToken(token),
			userId: user.id,
			purpose: 'reset',
			expiresAt: new Date(Date.now() + 3600_000)
		});
		await sendPasswordResetEmail(user.email, token);
	}
	return json({ ok: true });
};
