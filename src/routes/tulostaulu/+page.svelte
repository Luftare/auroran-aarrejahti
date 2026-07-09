<script lang="ts">
	import { onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { session } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	type Row = {
		rank: number;
		userId: string;
		displayName: string;
		isGhost: boolean;
		loots: number;
		streak: number;
		isMe: boolean;
	};

	let period = $state<'all' | 'today'>('all');
	let rows = $state<Row[]>([]);
	let loading = $state(true);
	let reportTarget = $state<Row | null>(null);
	let notice = $state('');

	async function load() {
		loading = true;
		try {
			const data = await api.get<{ rows: Row[] }>(`/api/leaderboard?period=${period}`);
			rows = data.rows;
		} catch {
			rows = [];
		}
		loading = false;
	}

	onMount(load);

	async function sendReport() {
		if (!reportTarget) return;
		try {
			await api.post('/api/reports', { reportedUserId: reportTarget.userId });
			notice = fi.reportSent;
		} catch (e) {
			notice = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
		}
		reportTarget = null;
		setTimeout(() => (notice = ''), 4000);
	}
</script>

<svelte:head><title>{fi.leaderboard} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.leaderboard} />

	<div class="tabs">
		<button
			class="tab"
			class:active={period === 'all'}
			onclick={() => { period = 'all'; load(); }}>{fi.allTime}</button
		>
		<button
			class="tab"
			class:active={period === 'today'}
			onclick={() => { period = 'today'; load(); }}>{fi.today}</button
		>
	</div>

	{#if notice}<p class="ok-text">{notice}</p>{/if}

	{#if loading}
		<p class="muted">…</p>
	{:else if rows.length === 0}
		<p class="muted">{fi.noChestsToday}</p>
	{:else}
		<ol class="board">
			{#each rows as row (row.userId)}
				<li class="card row" class:me={row.isMe}>
					<span class="rank">{row.rank}.</span>
					<span class="avatar">{row.isGhost ? '👻' : '🧭'}</span>
					<span class="name">
						{row.displayName}
						{#if row.isMe}<span class="muted"> ({fi.you})</span>{/if}
					</span>
					<span class="score">
						{fi.lootsUnit(row.loots)}
						{#if row.streak > 0}<span class="streak">🔥{row.streak}</span>{/if}
					</span>
					{#if !row.isMe && session.me}
						<button class="more" aria-label={fi.reportName} onclick={() => (reportTarget = row)}>⋯</button>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}

	{#if reportTarget}
		<div
			class="dialog-backdrop"
			role="presentation"
			onclick={() => (reportTarget = null)}
			onkeydown={(e) => e.key === 'Escape' && (reportTarget = null)}
		>
			<div
				class="card dialog"
				role="dialog"
				aria-modal="true"
				tabindex="-1"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<p>{fi.reportConfirm(reportTarget.displayName)}</p>
				<div class="dialog-actions">
					<button class="btn" onclick={() => (reportTarget = null)}>{fi.cancel}</button>
					<button class="btn btn-primary" onclick={sendReport}>{fi.confirm}</button>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
	}

	.tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tab {
		padding: 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg-raised);
		color: var(--muted);
		font-weight: 600;
	}

	.tab.active {
		background: var(--bg-card);
		color: var(--text);
		border-color: var(--aurora-teal);
	}

	.board {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 0.9rem;
	}

	.row.me { border-color: var(--aurora-green); }
	.rank { min-width: 2rem; font-weight: 700; color: var(--muted); }
	.name { flex: 1; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.score { font-size: 0.9rem; color: var(--muted); white-space: nowrap; }
	.streak { margin-left: 0.4rem; }
	.more { color: var(--muted); font-size: 1.2rem; padding: 0 0.2rem; }

	.dialog-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		z-index: 100;
	}

	.dialog { max-width: 340px; }
	.dialog-actions { display: flex; gap: 0.6rem; justify-content: flex-end; margin-top: 0.8rem; }
</style>
