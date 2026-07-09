import { json, type RequestHandler } from '@sveltejs/kit';
import { apiError } from '$lib/server/api';
import { purchaseRestore } from '$lib/server/game/streak';
import { rateLimit } from '$lib/server/ratelimit';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	if (!rateLimit(`restore:${locals.user.id}`, 5)) return apiError(429, 'RATE_LIMITED');
	const result = await purchaseRestore(locals.user.id);
	if (!result.ok) return apiError(400, result.code);
	return json(result);
};
