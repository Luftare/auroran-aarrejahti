import { sql } from 'drizzle-orm';
import {
	boolean,
	date,
	doublePrecision,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';

export const userKind = pgEnum('user_kind', ['ghost', 'registered']);
export const emailTokenPurpose = pgEnum('email_token_purpose', ['verify', 'reset']);
export const coinTxKind = pgEnum('coin_tx_kind', ['loot', 'streak_restore', 'adjustment']);
export const reportStatus = pgEnum('report_status', ['open', 'dismissed', 'actioned']);

export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		kind: userKind('kind').notNull().default('ghost'),
		email: text('email'),
		emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
		passwordHash: text('password_hash'),
		displayName: text('display_name').notNull(),
		isAdmin: boolean('is_admin').notNull().default(false),
		streakCurrent: integer('streak_current').notNull().default(0),
		streakBest: integer('streak_best').notNull().default(0),
		lastLootDay: date('last_loot_day'),
		// When a loot resets a restorable streak, the old streak is parked here
		// so it can still be bought back within the 3-day window.
		streakPrevious: integer('streak_previous').notNull().default(0),
		streakBrokenLastDay: date('streak_broken_last_day'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		disabledAt: timestamp('disabled_at', { withTimezone: true })
	},
	(t) => [
		uniqueIndex('users_email_unique').on(sql`lower(${t.email})`),
		uniqueIndex('users_display_name_unique').on(sql`lower(${t.displayName})`)
	]
);

export const ghostCredentials = pgTable('ghost_credentials', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	secretHash: text('secret_hash').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(), // sha256 of the bearer token
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const emailTokens = pgTable('email_tokens', {
	tokenHash: text('token_hash').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	purpose: emailTokenPurpose('purpose').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	usedAt: timestamp('used_at', { withTimezone: true })
});

export const spawnPoints = pgTable('spawn_points', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	lat: doublePrecision('lat').notNull(),
	lng: doublePrecision('lng').notNull(),
	active: boolean('active').notNull().default(true),
	notes: text('notes'),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const chests = pgTable(
	'chests',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		day: date('day').notNull(),
		spawnPointId: uuid('spawn_point_id')
			.notNull()
			.references(() => spawnPoints.id),
		coinCount: integer('coin_count').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [uniqueIndex('chests_day_spawn_unique').on(t.day, t.spawnPointId)]
);

export const loots = pgTable(
	'loots',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		chestId: uuid('chest_id')
			.notNull()
			.references(() => chests.id),
		day: date('day').notNull(),
		lootedAt: timestamp('looted_at', { withTimezone: true }).notNull().defaultNow(),
		lat: doublePrecision('lat').notNull(),
		lng: doublePrecision('lng').notNull(),
		accuracyM: doublePrecision('accuracy_m').notNull()
	},
	(t) => [uniqueIndex('loots_user_chest_unique').on(t.userId, t.chestId)]
);

export const coinTransactions = pgTable('coin_transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	amount: integer('amount').notNull(),
	kind: coinTxKind('kind').notNull(),
	refId: uuid('ref_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const streakRestores = pgTable('streak_restores', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	missedDays: integer('missed_days').notNull(),
	cost: integer('cost').notNull(),
	restoredStreakTo: integer('restored_streak_to').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const nameReports = pgTable('name_reports', {
	id: uuid('id').primaryKey().defaultRandom(),
	reporterId: uuid('reporter_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	reportedId: uuid('reported_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	status: reportStatus('status').notNull().default('open'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
	resolvedAt: timestamp('resolved_at', { withTimezone: true })
});

export const settings = pgTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});
