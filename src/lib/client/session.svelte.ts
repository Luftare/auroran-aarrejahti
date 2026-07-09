import { api, ApiError } from './api';
import { idbDelete, idbGet, idbSet } from './storage';
import type { MePayload } from '$lib/server/me';

const SECRET_KEY = 'laiteavain';

export const session = $state<{ me: MePayload | null; ready: boolean }>({
	me: null,
	ready: false
});

/**
 * Guarantees a playable identity: existing cookie session → stored ghost
 * device secret → brand-new ghost account.
 */
export async function ensureSession(): Promise<void> {
	try {
		const { user } = await api.get<{ user: MePayload }>('/api/me');
		session.me = user;
		session.ready = true;
		return;
	} catch (e) {
		if (!(e instanceof ApiError) || e.status !== 401) {
			session.ready = true;
			return;
		}
	}
	const secret = await idbGet(SECRET_KEY);
	if (secret) {
		try {
			const { user } = await api.post<{ user: MePayload }>('/api/ghost/login', {
				deviceSecret: secret
			});
			session.me = user;
			session.ready = true;
			return;
		} catch {
			// stale/invalid secret — fall through to a fresh ghost
		}
	}
	const created = await api.post<{ deviceSecret: string; user: MePayload }>('/api/ghost');
	await idbSet(SECRET_KEY, created.deviceSecret);
	session.me = created.user;
	session.ready = true;
}

export async function refreshMe(): Promise<void> {
	const { user } = await api.get<{ user: MePayload }>('/api/me');
	session.me = user;
}

export async function logout(): Promise<void> {
	await api.post('/api/auth/logout');
	await idbDelete(SECRET_KEY);
	session.me = null;
	location.href = '/';
}
