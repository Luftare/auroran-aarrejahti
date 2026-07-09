import { hash, verify } from '@node-rs/argon2';

// Argon2id parameters sized for the 1 GB production VM.
const PARAMS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export async function hashPassword(password: string): Promise<string> {
	return hash(password, PARAMS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	try {
		return await verify(passwordHash, password);
	} catch {
		return false;
	}
}

const COMMON = new Set([
	'salasana123',
	'password123',
	'1234567890',
	'qwertyuiop',
	'salasana1234',
	'kissakissa',
	'aurinko123',
	'perkele123',
	'q1w2e3r4t5'
]);

/** Returns an error code or null when the password is acceptable. */
export function passwordProblem(password: string): 'PASSWORD_TOO_SHORT' | 'PASSWORD_TOO_COMMON' | null {
	if (password.length < 10) return 'PASSWORD_TOO_SHORT';
	if (COMMON.has(password.toLowerCase())) return 'PASSWORD_TOO_COMMON';
	return null;
}
