import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { apiError, parseBody } from '$lib/server/api';
import { lootChest } from '$lib/server/game/loot';
import { rateLimit } from '$lib/server/ratelimit';

const schema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	accuracy: z.number().min(0).max(10_000)
});

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	if (!rateLimit(`loot:${locals.user.id}`, 10)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;

	const result = await lootChest(locals.user.id, params.id!, data);
	if (!result.ok) {
		const status = result.code === 'TOO_FAR' ? 403 : result.code === 'ALREADY_LOOTED' ? 409 : 410;
		return apiError(status, result.code);
	}
	return json(result);
};
