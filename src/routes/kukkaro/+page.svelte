<script lang="ts">
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { session, refreshMe } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let busy = $state(false);
	let message = $state('');
	let messageOk = $state(false);

	async function buyRestore() {
		busy = true;
		message = '';
		try {
			const result = await api.post<{ streak: number }>('/api/streak/restore');
			await refreshMe();
			message = fi.restored(result.streak) + (session.me?.lootedToday ? '' : ` ${fi.restoreReminder}`);
			messageOk = true;
		} catch (e) {
			message = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
			messageOk = false;
		}
		busy = false;
	}
</script>

<svelte:head><title>{fi.pouch} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.pouch} />

	{#if session.me}
		<div class="stats">
			<div class="card stat">
				<span class="value gold-text">🪙 {session.me.coins}</span>
				<span class="label">{fi.coins}</span>
			</div>
			<div class="card stat">
				<span class="value">📦 {session.me.loots}</span>
				<span class="label">{fi.totalLoots}</span>
			</div>
			<div class="card stat">
				<span class="value">🔥 {session.me.streak}</span>
				<span class="label">{fi.currentStreak}</span>
			</div>
			<div class="card stat">
				<span class="value">🏅 {session.me.streakBest}</span>
				<span class="label">{fi.bestStreak}</span>
			</div>
		</div>

		{#if session.me.restoreOffer}
			<section class="card restore">
				<strong>{fi.streakBroken}</strong>
				<p>{fi.restoreOffer(session.me.restoreOffer.missedDays, session.me.restoreOffer.cost)}</p>
				{#if session.me.coins >= session.me.restoreOffer.cost}
					<button class="btn btn-gold" disabled={busy} onclick={buyRestore}>{fi.restoreButton}</button>
				{:else}
					<p class="muted">{fi.notEnoughCoins(session.me.restoreOffer.cost - session.me.coins)}</p>
				{/if}
			</section>
		{/if}

		{#if message}
			<p class={messageOk ? 'ok-text' : 'error-text'}>{message}</p>
		{/if}
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		align-items: flex-start;
	}

	.value { font-size: 1.4rem; font-weight: 700; }
	.gold-text { color: var(--gold); }
	.label { color: var(--muted); font-size: 0.85rem; }

	.restore { border-color: var(--gold-deep); }
	.restore p { margin: 0.3rem 0 0.7rem; }
</style>
