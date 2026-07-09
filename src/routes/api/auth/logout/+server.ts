import { json, type RequestHandler } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth/session';

export const POST: RequestHandler = async ({ cookies }) => {
	await destroySession(cookies);
	return json({ ok: true });
};
