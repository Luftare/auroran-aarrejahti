<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api';

	type UserRow = {
		id: string;
		kind: 'ghost' | 'registered';
		displayName: string;
		email: string | null;
		isAdmin: boolean;
		streakCurrent: number;
		createdAt: string;
		disabledAt: string | null;
		loots: number;
		coins: number;
	};

	type Detail = {
		recentLoots: {
			lootedAt: string;
			lat: number;
			lng: number;
			accuracyM: number;
			coinCount: number;
			pointName: string;
		}[];
	};

	let users = $state<UserRow[]>([]);
	let openId = $state<string | null>(null);
	let detail = $state<Detail | null>(null);
	let message = $state('');

	async function load() {
		const data = await api.get<{ users: UserRow[] }>('/api/admin/users');
		users = data.users;
	}

	onMount(load);

	async function toggleDetail(id: string) {
		if (openId === id) {
			openId = null;
			detail = null;
			return;
		}
		openId = id;
		detail = null;
		detail = await api.get<Detail>(`/api/admin/users/${id}`);
	}

	async function resetName(id: string) {
		const result = await api.post<{ displayName: string }>(`/api/admin/users/${id}/reset-name`);
		message = `Nimi vaihdettu: ${result.displayName}`;
		await load();
	}

	async function setDisabled(id: string, disabled: boolean) {
		await api.post(`/api/admin/users/${id}/status`, { disabled });
		message = disabled ? 'Tunnus suljettu.' : 'Tunnus avattu.';
		await load();
	}

	const dateFmt = new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short', timeStyle: 'short' });
</script>

{#if message}<p class="ok-text">{message}</p>{/if}

<div class="list">
	{#each users as user (user.id)}
		<div class="card row">
			<button class="head" onclick={() => toggleDetail(user.id)}>
				<span class="avatar">{user.kind === 'ghost' ? '👻' : user.isAdmin ? '🛡️' : '🧭'}</span>
				<span class="name" class:disabled={user.disabledAt != null}>{user.displayName}</span>
				<span class="meta">{user.loots} 📦 · {user.coins} 🪙 · 🔥{user.streakCurrent}</span>
			</button>
			{#if openId === user.id}
				<div class="detail">
					<p class="muted small">
						{user.email ?? 'ei sähköpostia (haamu)'} · luotu {dateFmt.format(new Date(user.createdAt))}
						{#if user.disabledAt}· <strong>suljettu</strong>{/if}
					</p>
					<div class="actions">
						<button class="btn small-btn" onclick={() => resetName(user.id)}>Nollaa nimi</button>
						{#if user.disabledAt}
							<button class="btn small-btn" onclick={() => setDisabled(user.id, false)}>Avaa tunnus</button>
						{:else if !user.isAdmin}
							<button class="btn small-btn danger" onclick={() => setDisabled(user.id, true)}>Sulje tunnus</button>
						{/if}
					</div>
					{#if detail}
						<h3>Viimeisimmät ryöstöt</h3>
						{#if detail.recentLoots.length === 0}
							<p class="muted small">Ei vielä avattuja arkkuja.</p>
						{:else}
							<ul class="loots">
								{#each detail.recentLoots.slice(0, 10) as loot}
									<li>
										{dateFmt.format(new Date(loot.lootedAt))} — {loot.pointName} ({loot.coinCount} 🪙,
										tarkkuus {Math.round(loot.accuracyM)} m)
									</li>
								{/each}
							</ul>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.list { display: flex; flex-direction: column; gap: 0.5rem; }
	.row { padding: 0; overflow: hidden; }

	.head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.8rem 1rem;
		text-align: left;
	}

	.name { flex: 1; font-weight: 600; }
	.name.disabled { text-decoration: line-through; color: var(--muted); }
	.meta { color: var(--muted); font-size: 0.85rem; white-space: nowrap; }

	.detail { padding: 0 1rem 1rem; border-top: 1px solid var(--border); }
	.detail h3 { font-size: 0.95rem; margin-top: 1rem; }
	.small { font-size: 0.85rem; }
	.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.6rem; }
	.small-btn { padding: 0.4rem 0.9rem; font-size: 0.88rem; }
	.danger { border-color: var(--danger); color: var(--danger); }
	.loots { margin: 0.4rem 0 0; padding-left: 1.2rem; font-size: 0.85rem; color: var(--muted); }
</style>
