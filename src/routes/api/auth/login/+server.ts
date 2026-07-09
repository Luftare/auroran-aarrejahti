import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { apiError, parseBody } from '$lib/server/api';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { rateLimit } from '$lib/server/ratelimit';
import { findUserByEmail } from '$lib/server/users';
import { mePayload } from '$lib/server/me';

const schema = z.object({ email: z.string().email().max(200), password: z.string().max(200) });

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	if (!rateLimit(`login:${getClientAddress()}`, 10)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	const user = await findUserByEmail(data.email);
	if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, data.password))) {
		return apiError(401, 'INVALID_CREDENTIALS');
	}
	if (user.disabledAt) return apiError(403, 'ACCOUNT_DISABLED');
	await createSession(cookies, user.id);
	return json({ user: await mePayload(user.id) });
};
