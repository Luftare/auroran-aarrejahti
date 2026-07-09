import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, tables } from '$lib/server/db';
import { apiError, parseBody } from '$lib/server/api';
import { hashPassword, passwordProblem } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { generateToken, hashToken } from '$lib/server/auth/tokens';
import { sendVerificationEmail } from '$lib/server/auth/email';
import { rateLimit } from '$lib/server/ratelimit';
import { displayNameProblem, findUserByEmail, nameTaken } from '$lib/server/users';
import { mePayload } from '$lib/server/me';

const schema = z.object({
	email: z.string().email().max(200),
	password: z.string().max(200),
	displayName: z.string().min(1).max(40)
});

export const POST: RequestHandler = async ({ request, cookies, locals, getClientAddress }) => {
	if (!rateLimit(`register:${getClientAddress()}`, 5)) return apiError(429, 'RATE_LIMITED');
	const { data, error } = await parseBody(request, schema);
	if (error) return error;

	const name = data.displayName.trim();
	const nameProblem = displayNameProblem(name);
	if (nameProblem) return apiError(400, nameProblem);
	const pwProblem = passwordProblem(data.password);
	if (pwProblem) return apiError(400, pwProblem);
	if (await findUserByEmail(data.email)) return apiError(409, 'EMAIL_TAKEN');
	if (await nameTaken(name, locals.user?.id)) return apiError(409, 'NAME_TAKEN');

	const email = data.email.toLowerCase();
	const passwordHash = await hashPassword(data.password);

	let userId: string;
	if (locals.user && locals.user.kind === 'ghost') {
		// Upgrade the ghost in place — loots, coins and streak carry over.
		userId = locals.user.id;
		await db.transaction(async (tx) => {
			await tx
				.update(tables.users)
				.set({ kind: 'registered', email, passwordHash, displayName: name, updatedAt: new Date() })
				.where(eq(tables.users.id, userId));
			await tx.delete(tables.ghostCredentials).where(eq(tables.ghostCredentials.userId, userId));
		});
	} else {
		const inserted = await db
			.insert(tables.users)
			.values({ kind: 'registered', email, passwordHash, displayName: name })
			.returning({ id: tables.users.id });
		userId = inserted[0].id;
		await createSession(cookies, userId);
	}

	const token = generateToken();
	await db.insert(tables.emailTokens).values({
		tokenHash: hashToken(token),
		userId,
		purpose: 'verify',
		expiresAt: new Date(Date.now() + 24 * 3600_000)
	});
	await sendVerificationEmail(email, token);

	return json({ user: await mePayload(userId) });
};
