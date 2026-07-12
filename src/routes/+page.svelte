<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/state';
	import { fi } from '$lib/fi';
	import { game, initGame, collectChest, refreshDay, rollLoot } from '$lib/game/state.svelte';
	import { player, startPlayer, stopPlayer, syncPlayer } from '$lib/game/player.svelte';
	import { geo } from '$lib/client/geo.svelte';
	import { LOOT_RADIUS_M, type Chest } from '$lib/game/chests';
	import { distanceM, inRange } from '$lib/geo';
	import { idbDelete, idbGet, idbSet } from '$lib/client/storage';
	import Map from '$lib/components/Map.svelte';
	import ChestOverlay from '$lib/components/ChestOverlay.svelte';
	import CollectedGems from '$lib/components/CollectedGems.svelte';
	import GemGallery from '$lib/components/GemGallery.svelte';
	import Onboarding from '$lib/components/Onboarding.svelte';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Flame from '@lucide/svelte/icons/flame';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Gem from '@lucide/svelte/icons/gem';
	import MapPin from '@lucide/svelte/icons/map-pin';

	// New players see the onboarding first; the flag lives in IndexedDB.
	// Location watching (and its permission prompt) starts only when the
	// onboarding's final CTA is tapped — or right away for returning players.
	const ONBOARDED_KEY = 'perehdytys';
	let onboarding = $state(false);

	let openChestId = $state<string | null>(null);
	// Collection of gathered gems (opens from the chest chip)
	let gemsOpen = $state(false);
	// Debug: opens the chest view without walking and does not persist the collection
	let debugChestOpen = $state(false);
	// Debug: gem gallery
	let debugGemsOpen = $state(false);
	// Dev tools stay hidden unless the page is opened with ?debug
	const debugMode = $derived(page.url.searchParams.has('debug'));

	// GPS updates (or debug walking) flow into the player position
	$effect(() => {
		void geo.lat;
		void geo.lng;
		void geo.status;
		syncPlayer();
	});

	const nearest = $derived.by(() => {
		if (player.lat == null || player.lng == null) return null;
		let best: { chest: Chest; distance: number } | null = null;
		for (const chest of game.chests) {
			if (chest.looted) continue;
			const d = distanceM(player.lat, player.lng, chest.lat, chest.lng);
			if (!best || d < best.distance) best = { chest, distance: d };
		}
		return best;
	});

	const inRangeChestId = $derived(
		nearest && inRange(nearest.distance, LOOT_RADIUS_M, player.accuracy)
			? nearest.chest.id
			: null
	);

	function onchestclick(id: string) {
		if (id === inRangeChestId) openChestId = id;
	}

	function onVisible() {
		if (document.visibilityState === 'visible') refreshDay();
	}

	// The final onboarding CTA ends up here — startPlayer() runs inside the tap
	// gesture, so the browser shows the location-permission prompt immediately.
	function finishOnboarding() {
		onboarding = false;
		startPlayer();
		void idbSet(ONBOARDED_KEY, '1');
	}

	// Debug: replay the onboarding as a new player would see it
	function replayOnboarding() {
		stopPlayer();
		void idbDelete(ONBOARDED_KEY);
		onboarding = true;
	}

	onMount(() => {
		initGame();
		void (async () => {
			if (await idbGet(ONBOARDED_KEY)) startPlayer();
			else onboarding = true;
		})();
		document.addEventListener('visibilitychange', onVisible);
	});

	onDestroy(() => {
		stopPlayer();
		document.removeEventListener('visibilitychange', onVisible);
	});
</script>

<svelte:head><title>{fi.appName}</title></svelte:head>

<main>
	<Map
		chests={game.chests}
		playerLat={player.lat}
		playerLng={player.lng}
		inRangeId={inRangeChestId}
		{onchestclick}
	/>

	<!-- HUD: collected count on the left (opens the gem collection), streak on
	     the right (visible from the first treasure onward) -->
	<div class="hud">
		<button class="chip" title={fi.collected} onclick={() => (gemsOpen = true)}>
			<img class="chip-chest" src="/arkku.png" alt="" width="22" height="22" />
			{game.total}
		</button>
		{#if game.total > 0}
			<span class="chip" title={fi.streak}>
				<Flame size={18} color="var(--gold)" fill="var(--gold)" />
				{game.streak}
			</span>
		{/if}
	</div>

	{#if inRangeChestId}
		<!-- Treasure reached: open prompt at the bottom of the screen -->
		<button class="btn btn-gold open-cta" onclick={() => (openChestId = inRangeChestId)}>
			{fi.openTreasure}
		</button>
	{:else}
		<!-- Status row at the bottom: location status or distance to the nearest treasure -->
		<div class="hint">
			{#if player.source === 'none'}
				{#if player.geoStatus === 'denied'}
					{fi.locationDenied}
				{:else if player.geoStatus === 'unavailable'}
					{fi.locationUnavailable}
				{:else}
					{fi.locating}
				{/if}
			{:else if !nearest}
				{fi.allLooted}
			{:else}
				{fi.distanceToNearest(fi.formatDistance(nearest.distance))}
			{/if}
		</div>
	{/if}

	{#if debugMode}
		<!-- Debug: open the chest view without walking (does not persist anything) -->
		<button class="debug-btn" onclick={() => (debugChestOpen = true)} aria-label={fi.debugChest}>
			<FlaskConical size={18} />
		</button>

		<!-- Debug: gem gallery -->
		<button
			class="debug-btn gems"
			onclick={() => (debugGemsOpen = true)}
			aria-label={fi.debugGems}
		>
			<Gem size={18} />
		</button>

		<!-- Dev tool: chest-slot editor -->
		<a class="debug-btn editor" href="/editori" aria-label={fi.editorTitle}>
			<MapPin size={18} />
		</a>

		<!-- Debug: replay the new-player onboarding flow -->
		<button class="debug-btn onboarding" onclick={replayOnboarding} aria-label={fi.debugOnboarding}>
			<BookOpen size={18} />
		</button>
	{/if}

	{#if openChestId}
		<ChestOverlay
			streak={game.streak}
			oncollect={(multiplier) => collectChest(openChestId!, multiplier)}
			onback={() => (openChestId = null)}
		/>
	{:else if debugChestOpen}
		<ChestOverlay
			streak={game.streak || 1}
			oncollect={async (multiplier) => ({ firstToday: true, loot: rollLoot(multiplier) })}
			onback={() => (debugChestOpen = false)}
		/>
	{/if}

	{#if gemsOpen}
		<CollectedGems gems={game.gems} onclose={() => (gemsOpen = false)} />
	{/if}

	{#if debugGemsOpen}
		<GemGallery onclose={() => (debugGemsOpen = false)} />
	{/if}

	{#if onboarding}
		<Onboarding oncomplete={finishOnboarding} />
	{/if}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}

	.hud {
		position: absolute;
		top: calc(0.8rem + env(safe-area-inset-top));
		left: 1rem;
		right: 1rem;
		display: flex;
		justify-content: space-between;
		z-index: 10;
		pointer-events: none;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		background: var(--bg);
		font-weight: 700;
		font-size: 1.05rem;
	}

	/* The streak stays at the right edge even if the collected-count chip is missing */
	.chip:first-child { margin-right: auto; }

	button.chip { pointer-events: auto; color: var(--text); }
	.chip-chest { display: block; }

	.debug-btn {
		position: absolute;
		left: 1rem;
		bottom: calc(5rem + env(safe-area-inset-bottom));
		z-index: 10;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(16, 40, 51, 0.9);
		color: var(--muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.debug-btn.gems {
		bottom: calc(8.2rem + env(safe-area-inset-bottom));
	}

	.debug-btn.editor {
		bottom: calc(11.4rem + env(safe-area-inset-bottom));
	}

	.debug-btn.onboarding {
		bottom: calc(14.6rem + env(safe-area-inset-bottom));
	}

	/* A dark ring separates the button from the light map base */
	.open-cta {
		position: absolute;
		left: 50%;
		bottom: calc(3rem + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		z-index: 10;
		width: min(60vw, 280px);
		padding: 0.9rem 1.4rem;
		font-size: 1.15rem;
		font-weight: 800;
		border: 3px solid var(--bg-high);
	}

	.hint {
		position: absolute;
		left: 50%;
		bottom: calc(3rem + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		z-index: 10;
		max-width: min(85vw, 420px);
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: var(--bg);
		font-weight: 600;
		font-size: 0.92rem;
		text-align: center;
	}
</style>
