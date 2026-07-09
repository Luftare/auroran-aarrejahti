import { apiError } from './api';

/** Admin routes answer 404 to everyone else — the console's existence is not acknowledged. */
export function requireAdmin(locals: App.Locals): Response | null {
	if (!locals.user?.isAdmin) return apiError(404, 'NOT_FOUND');
	return null;
}
