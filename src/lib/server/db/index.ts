import type { PgDatabase } from 'drizzle-orm/pg-core';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export type Db = PgDatabase<any, typeof schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

async function create(): Promise<Db> {
	if (env.DATABASE_URL) {
		const postgres = (await import('postgres')).default;
		const { drizzle } = await import('drizzle-orm/postgres-js');
		const { migrate } = await import('drizzle-orm/postgres-js/migrator');
		const client = postgres(env.DATABASE_URL, { max: 10, onnotice: () => {} });
		const database = drizzle(client, { schema });
		await migrate(database, { migrationsFolder: 'drizzle' });
		return database as unknown as Db;
	}
	// Dev fallback: embedded Postgres (PGlite) so contributors need no local database.
	const { PGlite } = await import('@electric-sql/pglite');
	const { drizzle } = await import('drizzle-orm/pglite');
	const { migrate } = await import('drizzle-orm/pglite/migrator');
	const client = new PGlite(env.PGLITE_DIR || './.dev-db');
	const database = drizzle(client, { schema });
	await migrate(database, { migrationsFolder: 'drizzle' });
	console.log('[db] DATABASE_URL not set — using embedded PGlite database (dev only)');
	return database as unknown as Db;
}

export const db = await create();
export * as tables from './schema';
