<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { session, refreshMe } from '$lib/client/session.svelte';
	import { geo, startWatching, stopWatching } from '$lib/client/geo.svelte';
	import { distanceM, inRange } from '$lib/geo';
	import Map from '$lib/components/Map.svelte';
	import ChestView from '$lib/components/ChestView.svelte';

	type Chest = { id: string; lat: number; lng: number; looted: boolean };

	let chests = $state<Chest[]>([]);
	let day = $state('');
	let lootRadiusM = $state(15);
	let mode = $state<'map' | 'chest'>('map');
	let activeChestId = $state<string | null>(null);
	let dismissedChestId = $state<string | null>(null);
	let introSeen = $state(localStorage.getItem('esittely-nahty') === '1');
	let ghostBanner = $state(false);
	let restoreBusy = $state(false);
	let restoreError = $state('');

	const nearest = $derived.by(() => {
		if (geo.lat == null || geo.lng == null) return null;
		let best: { chest: Chest; distance: number } | null = null;
		for (const chest of chests) {
			if (chest.looted) continue;
			const d = distanceM(geo.lat, geo.lng, chest.lat, chest.lng);
			if (!best || d < best.distance) best = { chest, distance: d };
		}
		return best;
	});

	const nearestInRange = $derived(
		nearest != null && inRange(nearest.distance, lootRadiusM, geo.accuracy)
	);

	// Arkku aukeaa näkymään automaattisesti, kun pelaaja kävelee sen luo —
	// paitsi jos pelaaja itse palasi kartalle saman arkun kohdalla.
	$effect(() => {
		if (mode === 'map' && nearestInRange && nearest && nearest.chest.id !== dismissedChestId) {
			activeChestId = nearest.chest.id;
			mode = 'chest';
		}
	});

	async function loadChests() {
		try {
			const data = await api.get<{ day: string; lootRadiusM: number; chests: Chest[] }>(
				'/api/chests/today'
			);
			if (day && data.day !== day) dismissedChestId = null;
			day = data.day;
			lootRadiusM = data.lootRadiusM;
			chests = data.chests;
		} catch {
			// verkko-ongelma — toimintakortti näyttää tilanteen seuraavalla yrityksellä
		}
	}

	function onVisible() {
		if (document.visibilityState === 'visible') {
			loadChests();
			startWatching();
		} else {
			stopWatching();
		}
	}

	onMount(() => {
		if (introSeen) begin();
		document.addEventListener('visibilitychange', onVisible);
		const last = Number(localStorage.getItem('haamumuistutus') || 0);
		ghostBanner = Date.now() - last > 7 * 86_400_000;
	});

	onDestroy(() => {
		stopWatching();
		document.removeEventListener('visibilitychange', onVisible);
	});

	function begin() {
		startWatching();
		const wait = setInterval(() => {
			if (session.ready) {
				clearInterval(wait);
				if (session.me) loadChests();
			}
		}, 150);
	}

	function startIntroDone() {
		localStorage.setItem('esittely-nahty', '1');
		introSeen = true;
		begin();
	}

	function dismissGhostBanner() {
		localStorage.setItem('haamumuistutus', String(Date.now()));
		ghostBanner = false;
	}

	function onlooted(result: { coins: number; streak: number; isFirstLootToday: boolean }) {
		chests = chests.map((c) => (c.id === activeChestId ? { ...c, looted: true } : c));
		if (session.me) {
			session.me.coins = result.coins;
			session.me.streak = result.streak;
			session.me.loots += 1;
			session.me.lootedToday = true;
			session.me.restoreOffer = null;
		}
		refreshMe().catch(() => {});
	}

	function backToMap() {
		dismissedChestId = activeChestId;
		activeChestId = null;
		mode = 'map';
	}

	async function buyRestore() {
		restoreBusy = true;
		restoreError = '';
		try {
			const result = await api.post<{ streak: number; coins: number }>('/api/streak/restore');
			if (session.me) {
				session.me.streak = session.me.lootedToday ? result.streak : session.me.streak;
				session.me.coins = result.coins;
				session.me.restoreOffer = null;
				session.me.streakBest = Math.max(session.me.streakBest, result.streak);
			}
			await refreshMe();
		} catch (e) {
			restoreError = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
		}
		restoreBusy = false;
	}
</script>

<svelte:head><title>{fi.appName}</title></svelte:head>

{#if !introSeen}
	<div class="intro">
		<h1>{fi.introTitle}</h1>
		<p>{fi.introBody1}</p>
		<p>{fi.introBody2}</p>
		<p class="muted">{fi.introLocation}</p>
		<button class="btn btn-primary" onclick={startIntroDone}>{fi.introStart}</button>
	</div>
{:else}
	<main>
		<header class="status-row">
			<a class="status-item" href="/asetukset" aria-label={fi.settings}>⚙️</a>
			<span class="status-item" title={fi.streak}>🔥 {session.me?.streak ?? 0}</span>
			<span class="status-item gold" title={fi.coins}>🪙 {session.me?.coins ?? 0}</span>
		</header>

		{#if geo.status === 'denied' || geo.status === 'unavailable'}
			<!-- Peliin ei pääse ilman sijaintia -->
			<div class="circle-placeholder">
				<span class="placeholder-icon">📍</span>
				<p><strong>{fi.locationNeeded}</strong></p>
				<p class="muted">
					{geo.status === 'denied' ? fi.locationDenied : fi.locationUnavailable}
				</p>
				<button class="btn" onclick={() => location.reload()}>{fi.retry}</button>
			</div>
		{:else if geo.status !== 'ok'}
			<!-- Karttaa ei näytetä ennen kuin sijainti on löytynyt -->
			<div class="circle-placeholder">
				<span class="spinner" aria-hidden="true"></span>
				<p>{fi.locating}</p>
			</div>
		{:else if mode === 'chest' && activeChestId}
			<ChestView chestId={activeChestId} {onlooted} onback={backToMap} />
		{:else}
			<Map {chests} playerLat={geo.lat} playerLng={geo.lng} accuracy={geo.accuracy} />
		{/if}

		{#if mode === 'map' && geo.status === 'ok'}
			<section class="card action">
				{#if chests.length === 0}
					{fi.noChestsToday}
				{:else if !nearest}
					{fi.allLooted}
				{:else if nearestInRange}
					<button
						class="btn btn-gold"
						onclick={() => {
							dismissedChestId = null;
							activeChestId = nearest!.chest.id;
							mode = 'chest';
						}}
					>
						{fi.tapToOpen}
					</button>
				{:else}
					{fi.distanceToNearest(fi.formatDistance(nearest.distance))}
				{/if}
			</section>
		{/if}

		{#if session.me?.restoreOffer && mode === 'map'}
			<section class="card restore">
				<strong>{fi.streakBroken}</strong>
				<p>{fi.restoreOffer(session.me.restoreOffer.missedDays, session.me.restoreOffer.cost)}</p>
				{#if session.me.coins >= session.me.restoreOffer.cost}
					<button class="btn btn-gold" disabled={restoreBusy} onclick={buyRestore}>
						{fi.restoreButton}
					</button>
				{:else}
					<p class="muted">{fi.notEnoughCoins(session.me.restoreOffer.cost - session.me.coins)}</p>
				{/if}
				{#if restoreError}<p class="error-text">{restoreError}</p>{/if}
			</section>
		{/if}

		{#if ghostBanner && session.me?.kind === 'ghost' && mode === 'map'}
			<section class="card ghost-banner">
				<p>{fi.ghostReminder}</p>
				<div class="banner-actions">
					<a class="btn btn-primary" href="/luo-tunnus">{fi.createAccount}</a>
					<button class="btn" onclick={dismissGhostBanner}>{fi.cancel}</button>
				</div>
			</section>
		{/if}

		<nav class="bottom-nav">
			<a class="btn" href="/tulostaulu">{fi.leaderboard}</a>
			<a class="btn" href="/kukkaro">{fi.pouch}</a>
		</nav>
	</main>
{/if}

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem calc(1.5rem + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.intro {
		max-width: 480px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.intro .btn { margin-top: 1.5rem; }

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.status-item {
		font-weight: 700;
		font-size: 1.05rem;
		text-decoration: none;
	}

	.status-item:first-child { margin-right: auto; font-size: 1.3rem; }
	.gold { color: var(--gold); }

	.action {
		text-align: center;
		font-weight: 600;
		min-height: 3.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Ympyräalueen paikanhaku- ja virhetila kartan tilalla */
	.circle-placeholder {
		width: min(90vw, 420px);
		aspect-ratio: 1;
		margin: 0 auto;
		border-radius: 50%;
		border: 3px solid var(--border);
		background: var(--bg-raised);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		text-align: center;
		padding: 2.5rem;
		box-shadow: var(--shadow);
	}

	.circle-placeholder p { margin: 0; }
	.circle-placeholder .btn { margin-top: 0.8rem; }
	.placeholder-icon { font-size: 2.2rem; }

	.spinner {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 4px solid var(--border);
		border-top-color: var(--aurora-green);
		animation: spin 0.9s linear infinite;
		margin-bottom: 0.5rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.restore { border-color: var(--gold-deep); }
	.restore p { margin: 0.3rem 0 0.7rem; }

	.ghost-banner p { margin: 0 0 0.7rem; font-size: 0.92rem; }
	.banner-actions { display: flex; gap: 0.6rem; }

	.bottom-nav {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
	}
</style>
