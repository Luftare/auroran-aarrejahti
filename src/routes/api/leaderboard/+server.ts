import { json, type RequestHandler } from '@sveltejs/kit';
import { apiError } from '$lib/server/api';
import { leaderboard } from '$lib/server/game/leaderboard';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return apiError(401, 'UNAUTHORIZED');
	const period = url.searchParams.get('period') === 'today' ? 'today' : 'all';
	return json({ period, rows: await leaderboard(period, locals.user.id) });
};
