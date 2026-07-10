<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { game, initGame, collectChest, refreshDay } from '$lib/game/state.svelte';
	import { player, startPlayer, stopPlayer, syncPlayer } from '$lib/game/player.svelte';
	import { geo } from '$lib/client/geo.svelte';
	import { LOOT_RADIUS_M, type Chest } from '$lib/game/chests';
	import { distanceM, inRange } from '$lib/geo';
	import Map from '$lib/components/Map.svelte';
	import ChestOverlay from '$lib/components/ChestOverlay.svelte';
	import GemGallery from '$lib/components/GemGallery.svelte';
	import Flame from '@lucide/svelte/icons/flame';
	import FlaskConical from '@lucide/svelte/icons/flask-conical';
	import Gem from '@lucide/svelte/icons/gem';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Package from '@lucide/svelte/icons/package';

	let openChestId = $state<string | null>(null);
	// Debug: avaa arkkunäkymän ilman kävelyä eikä tallenna keräystä
	let debugChestOpen = $state(false);
	// Debug: jalokivigalleria
	let debugGemsOpen = $state(false);

	// GPS-päivitykset (tai debug-kävely) valuvat pelaajan sijaintiin
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

	onMount(() => {
		initGame();
		startPlayer();
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

	<!-- HUD: kerätyt vasemmalla, putki oikealla (näkyy ensimmäisestä aarteesta) -->
	<div class="hud">
		<span class="chip" title={fi.collected}>
			<Package size={18} color="var(--aurora-teal)" />
			{game.total}
		</span>
		{#if game.total > 0}
			<span class="chip" title={fi.streak}>
				<Flame size={18} color="var(--gold)" fill="var(--gold)" />
				{game.streak}
			</span>
		{/if}
	</div>

	{#if inRangeChestId}
		<!-- Aarre saavutettu: kehotus avaamaan ruudun alalaidassa -->
		<button class="btn btn-gold open-cta" onclick={() => (openChestId = inRangeChestId)}>
			{fi.openTreasure}
		</button>
	{:else}
		<!-- Tilarivi alhaalla: sijainnin tila tai etäisyys lähimpään aarteeseen -->
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

	<!-- Debug: arkun avauksen kokeilu ilman kävelyä (ei tallenna mitään) -->
	<button class="debug-btn" onclick={() => (debugChestOpen = true)} aria-label={fi.debugChest}>
		<FlaskConical size={18} />
	</button>

	<!-- Debug: jalokivigalleria -->
	<button
		class="debug-btn gems"
		onclick={() => (debugGemsOpen = true)}
		aria-label={fi.debugGems}
	>
		<Gem size={18} />
	</button>

	<!-- Kehitystyökalu: kätköpaikkaeditori -->
	<a class="debug-btn editor" href="/editori" aria-label={fi.editorTitle}>
		<MapPin size={18} />
	</a>

	{#if openChestId}
		<ChestOverlay
			streak={game.streak}
			oncollect={() => collectChest(openChestId!)}
			onback={() => (openChestId = null)}
		/>
	{:else if debugChestOpen}
		<ChestOverlay
			streak={game.streak || 1}
			oncollect={async () => true}
			onback={() => (debugChestOpen = false)}
		/>
	{/if}

	{#if debugGemsOpen}
		<GemGallery onclose={() => (debugGemsOpen = false)} />
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

	/* Putki on aina oikeassa reunassa, vaikka keräyschippi puuttuisi */
	.chip:first-child { margin-right: auto; }

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

	/* Tumma reunus erottaa napin vaaleasta karttapohjasta */
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
