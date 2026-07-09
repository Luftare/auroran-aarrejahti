import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { apiError, parseBody } from '$lib/server/api';
import { createSession } from '$lib/server/auth/session';
import { rateLimit } from '$lib/server/ratelimit';
import { findGhostBySecret } from '$lib/server/users';
import { mePayload } from '$lib/server/me';

const schema = z.object({ deviceSecret: z.string().min(20).max(200) });

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	if (!rateLimit(`ghost-login:${getClientAddress()}`, 10)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;
	const user = await findGhostBySecret(data.deviceSecret);
	if (!user || user.disabledAt) return apiError(401, 'INVALID_CREDENTIALS');
	await createSession(cookies, user.id);
	return json({ user: await mePayload(user.id) });
};
