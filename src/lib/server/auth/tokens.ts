import { createHash, randomBytes } from 'node:crypto';

/** Random 256-bit token, base64url. */
export function generateToken(): string {
	return randomBytes(32).toString('base64url');
}

/** SHA-256 hex of a token — what gets stored in the database. */
export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}
