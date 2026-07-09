import { eq } from 'drizzle-orm';
import { db, tables } from './db';

const DEFAULTS = {
	daily_chest_count: 5,
	loot_radius_m: 15
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export async function getSetting(key: SettingKey): Promise<number> {
	const row = await db.select().from(tables.settings).where(eq(tables.settings.key, key));
	const parsed = row[0] ? Number(row[0].value) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULTS[key];
}

export async function setSetting(key: SettingKey, value: number): Promise<void> {
	await db
		.insert(tables.settings)
		.values({ key, value: String(value) })
		.onConflictDoUpdate({ target: tables.settings.key, set: { value: String(value) } });
}

export async function getAllSettings(): Promise<Record<SettingKey, number>> {
	return {
		daily_chest_count: await getSetting('daily_chest_count'),
		loot_radius_m: await getSetting('loot_radius_m')
	};
}
