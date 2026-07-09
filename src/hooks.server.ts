import type { Handle, ServerInit } from '@sveltejs/kit';
import { bootstrap } from '$lib/server/bootstrap';
import { resolveSession } from '$lib/server/auth/session';

export const init: ServerInit = async () => {
	await bootstrap();
};

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await resolveSession(event.cookies);
	// Disabled accounts keep read access to public pages but every API call is refused.
	if (
		event.locals.user?.disabled &&
		event.url.pathname.startsWith('/api') &&
		event.url.pathname !== '/api/auth/logout'
	) {
		return new Response(
			JSON.stringify({ code: 'ACCOUNT_DISABLED', message: 'Tunnuksesi on suljettu. Ota yhteyttä ylläpitoon.' }),
			{ status: 403, headers: { 'content-type': 'application/json' } }
		);
	}
	return resolve(event);
};
