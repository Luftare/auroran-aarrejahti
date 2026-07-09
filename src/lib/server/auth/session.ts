import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db, tables } from '../db';
import { generateToken, hashToken } from './tokens';

const SESSION_COOKIE = 'session';
const SESSION_DAYS = 30;

export type SessionUser = {
	id: string;
	kind: 'ghost' | 'registered';
	displayName: string;
	email: string | null;
	emailVerified: boolean;
	isAdmin: boolean;
	streakCurrent: number;
	streakBest: number;
	lastLootDay: string | null;
	disabled: boolean;
};

function expiry(): Date {
	return new Date(Date.now() + SESSION_DAYS * 86_400_000);
}

export async function createSession(cookies: Cookies, userId: string): Promise<void> {
	const token = generateToken();
	await db.insert(tables.sessions).values({ id: hashToken(token), userId, expiresAt: expiry() });
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DAYS * 86_400
	});
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db.delete(tables.sessions).where(eq(tables.sessions.id, hashToken(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function destroyAllSessions(userId: string): Promise<void> {
	await db.delete(tables.sessions).where(eq(tables.sessions.userId, userId));
}

export async function resolveSession(cookies: Cookies): Promise<SessionUser | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const id = hashToken(token);
	const rows = await db
		.select({ session: tables.sessions, user: tables.users })
		.from(tables.sessions)
		.innerJoin(tables.users, eq(tables.sessions.userId, tables.users.id))
		.where(eq(tables.sessions.id, id));
	const row = rows[0];
	if (!row) return null;
	if (row.session.expiresAt < new Date()) {
		await db.delete(tables.sessions).where(eq(tables.sessions.id, id));
		return null;
	}
	// Sliding expiry: refresh when less than half the window remains.
	if (row.session.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * 86_400_000) {
		await db.update(tables.sessions).set({ expiresAt: expiry() }).where(eq(tables.sessions.id, id));
	}
	const u = row.user;
	return {
		id: u.id,
		kind: u.kind,
		displayName: u.displayName,
		email: u.email,
		emailVerified: u.emailVerifiedAt != null,
		isAdmin: u.isAdmin,
		streakCurrent: u.streakCurrent,
		streakBest: u.streakBest,
		lastLootDay: u.lastLootDay,
		disabled: u.disabledAt != null
	};
}
