import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { db, tables } from './db';
import { hashPassword } from './auth/password';
import { findUserByEmail } from './users';
import { ensureChestsForDay } from './game/spawn';

// Demo spawn points around Järvenperä for development. Real points are
// managed in the admin console; these seed only the embedded dev database.
const DEMO_POINTS = [
	{ name: 'Lammen laituri', lat: 60.2762, lng: 24.6394 },
	{ name: 'Metsäpolun risteys', lat: 60.279, lng: 24.6512 },
	{ name: 'Vanha bussipysäkki', lat: 60.2735, lng: 24.6558 },
	{ name: 'Pellon reuna', lat: 60.2814, lng: 24.6431 },
	{ name: 'Kallion näköala', lat: 60.2778, lng: 24.6602 },
	{ name: 'Ojanvarren silta', lat: 60.2718, lng: 24.6469 },
	{ name: 'Kuusikon aukio', lat: 60.2841, lng: 24.6547 }
];

async function ensureAdmin(): Promise<void> {
	if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
	const existing = await findUserByEmail(env.ADMIN_EMAIL);
	if (existing) return;
	await db.insert(tables.users).values({
		kind: 'registered',
		email: env.ADMIN_EMAIL.toLowerCase(),
		emailVerifiedAt: new Date(),
		passwordHash: await hashPassword(env.ADMIN_PASSWORD),
		displayName: env.ADMIN_NAME || 'Ylläpito',
		isAdmin: true
	});
	console.log(`[bootstrap] admin user created for ${env.ADMIN_EMAIL}`);
}

async function seedDevSpawnPoints(): Promise<void> {
	if (env.DATABASE_URL) return; // real deployments manage points in the admin console
	const points = await db.select({ id: tables.spawnPoints.id }).from(tables.spawnPoints);
	if (points.length > 0) return;
	await db.insert(tables.spawnPoints).values(DEMO_POINTS);
	console.log('[bootstrap] seeded demo spawn points (dev database)');
}

async function scheduleDailySpawn(): Promise<void> {
	const cron = await import('node-cron');
	cron.schedule('1 0 * * *', () => ensureChestsForDay().catch((e) => console.error('[spawn]', e)), {
		timezone: 'Europe/Helsinki'
	});
}

let done = false;

export async function bootstrap(): Promise<void> {
	if (done || building) return;
	done = true;
	await ensureAdmin();
	await seedDevSpawnPoints();
	await ensureChestsForDay();
	await scheduleDailySpawn();
	console.log('[bootstrap] ready');
}
