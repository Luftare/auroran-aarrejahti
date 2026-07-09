import { json, type RequestHandler } from '@sveltejs/kit';
import { apiError } from '$lib/server/api';
import { createSession } from '$lib/server/auth/session';
import { rateLimit } from '$lib/server/ratelimit';
import { createGhost } from '$lib/server/users';
import { mePayload } from '$lib/server/me';

export const POST: RequestHandler = async ({ cookies, getClientAddress }) => {
	if (!rateLimit(`ghost:${getClientAddress()}`, 5)) return apiError(429, 'RATE_LIMITED');
	const { userId, deviceSecret } = await createGhost();
	await createSession(cookies, userId);
	return json({ deviceSecret, user: await mePayload(userId) });
};
