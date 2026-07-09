import { and, count, eq, sql } from 'drizzle-orm';
import { db, tables } from './db';
import { generateGhostName } from './auth/ghostnames';
import { generateToken, hashToken } from './auth/tokens';

const NAME_RE = /^[\p{L}\p{N}](?:[\p{L}\p{N} -]{1,18})[\p{L}\p{N}]$/u;
const NAME_BLOCKLIST = ['ylläpito', 'admin', 'aurora', 'moderaattori'];

export function displayNameProblem(name: string): 'NAME_INVALID' | 'NAME_BLOCKED' | null {
	if (!NAME_RE.test(name)) return 'NAME_INVALID';
	const lower = name.toLowerCase();
	if (NAME_BLOCKLIST.some((b) => lower.includes(b)) || lower.startsWith('haamu '))
		return 'NAME_BLOCKED';
	return null;
}

export async function nameTaken(name: string, excludeUserId?: string): Promise<boolean> {
	const rows = await db
		.select({ id: tables.users.id })
		.from(tables.users)
		.where(sql`lower(${tables.users.displayName}) = ${name.toLowerCase()}`);
	return rows.some((r) => r.id !== excludeUserId);
}

export async function findUserByEmail(email: string) {
	const rows = await db
		.select()
		.from(tables.users)
		.where(sql`lower(${tables.users.email}) = ${email.toLowerCase()}`);
	return rows[0] ?? null;
}

/** Creates a ghost user + device credential. Returns the plaintext device secret once. */
export async function createGhost(): Promise<{ userId: string; deviceSecret: string }> {
	for (let attempt = 0; attempt < 10; attempt++) {
		const name = generateGhostName(attempt);
		if (await nameTaken(name)) continue;
		try {
			const inserted = await db
				.insert(tables.users)
				.values({ kind: 'ghost', displayName: name })
				.returning({ id: tables.users.id });
			const userId = inserted[0].id;
			const deviceSecret = generateToken();
			await db
				.insert(tables.ghostCredentials)
				.values({ userId, secretHash: hashToken(deviceSecret) });
			return { userId, deviceSecret };
		} catch {
			continue; // unique-name race; retry with a new name
		}
	}
	throw new Error('could not generate a unique ghost name');
}

export async function findGhostBySecret(deviceSecret: string) {
	const rows = await db
		.select({ user: tables.users })
		.from(tables.ghostCredentials)
		.innerJoin(tables.users, eq(tables.ghostCredentials.userId, tables.users.id))
		.where(eq(tables.ghostCredentials.secretHash, hashToken(deviceSecret)));
	return rows[0]?.user ?? null;
}

export async function coinBalance(userId: string): Promise<number> {
	const rows = await db
		.select({ sum: sql<string>`coalesce(sum(${tables.coinTransactions.amount}), 0)` })
		.from(tables.coinTransactions)
		.where(eq(tables.coinTransactions.userId, userId));
	return Number(rows[0]?.sum ?? 0);
}

export async function lootTotal(userId: string, day?: string): Promise<number> {
	const where = day
		? and(eq(tables.loots.userId, userId), eq(tables.loots.day, day))
		: eq(tables.loots.userId, userId);
	const rows = await db.select({ n: count() }).from(tables.loots).where(where);
	return rows[0]?.n ?? 0;
}

/** Moderation: replace a name with a fresh generated one. */
export async function resetDisplayName(userId: string): Promise<string> {
	for (let attempt = 1; attempt < 10; attempt++) {
		const name = generateGhostName(attempt);
		if (await nameTaken(name)) continue;
		await db
			.update(tables.users)
			.set({ displayName: name, updatedAt: new Date() })
			.where(eq(tables.users.id, userId));
		return name;
	}
	throw new Error('could not generate a unique replacement name');
}
