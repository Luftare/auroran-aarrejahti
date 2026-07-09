<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fi } from '$lib/fi';

	type Chest = { id: string; lat: number; lng: number; looted: boolean };

	let {
		chests = [] as Chest[],
		playerLat = null as number | null,
		playerLng = null as number | null,
		accuracy = 0
	} = $props();

	const DEFAULT_CENTER: [number, number] = [24.65, 60.278]; // Järvenperä

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let playerMarker: maplibregl.Marker | null = null;
	let chestMarkers = new Map<string, maplibregl.Marker>();
	let panned = $state(false);
	let centeredOnce = false;

	const CHEST_SVG = `<svg viewBox="0 0 24 24" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
		<rect x="3" y="10" width="18" height="10" rx="2" fill="#8a5a2b" stroke="#5c3a17" stroke-width="1.2"/>
		<path d="M3 10a9 5.5 0 0 1 18 0z" fill="#a06a33" stroke="#5c3a17" stroke-width="1.2"/>
		<rect x="10.4" y="9" width="3.2" height="5" rx="1" fill="#ffd166" stroke="#b8860b" stroke-width="0.8"/>
	</svg>`;

	onMount(() => {
		map = new maplibregl.Map({
			container,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: DEFAULT_CENTER,
			zoom: 14,
			attributionControl: { compact: true }
		});
		map.on('dragstart', () => (panned = true));
		map.touchPitch.disable();
	});

	onDestroy(() => map?.remove());

	// Pelaajan sijaintimerkki
	$effect(() => {
		if (!map || playerLat == null || playerLng == null) return;
		if (!playerMarker) {
			const el = document.createElement('div');
			el.className = 'player-dot';
			el.innerHTML = '<div class="player-pulse"></div><div class="player-core"></div>';
			playerMarker = new maplibregl.Marker({ element: el }).setLngLat([playerLng, playerLat]).addTo(map);
		} else {
			playerMarker.setLngLat([playerLng, playerLat]);
		}
		if (!centeredOnce) {
			centeredOnce = true;
			map.jumpTo({ center: [playerLng, playerLat], zoom: 15 });
		}
	});

	// Arkkumerkit — avatut arkut poistuvat pelaajan kartalta
	$effect(() => {
		if (!map) return;
		const visible = chests.filter((c) => !c.looted);
		const wanted = new Set(visible.map((c) => c.id));
		for (const [id, marker] of chestMarkers) {
			if (!wanted.has(id)) {
				marker.remove();
				chestMarkers.delete(id);
			}
		}
		for (const chest of visible) {
			if (chestMarkers.has(chest.id)) continue;
			const el = document.createElement('div');
			el.className = 'chest-marker';
			el.innerHTML = CHEST_SVG;
			chestMarkers.set(
				chest.id,
				new maplibregl.Marker({ element: el }).setLngLat([chest.lng, chest.lat]).addTo(map)
			);
		}
	});

	function recenter() {
		if (map && playerLat != null && playerLng != null) {
			map.easeTo({ center: [playerLng, playerLat], zoom: 15 });
			panned = false;
		}
	}
</script>

<div class="circle">
	<div class="map" bind:this={container}></div>
	<div class="controls">
		{#if panned && playerLat != null}
			<button class="ctrl" onclick={recenter} aria-label={fi.recenter}>◎</button>
		{/if}
		<button class="ctrl" onclick={() => map?.zoomIn()} aria-label={fi.zoomIn}>+</button>
		<button class="ctrl" onclick={() => map?.zoomOut()} aria-label={fi.zoomOut}>−</button>
	</div>
</div>

<style>
	.circle {
		position: relative;
		width: min(90vw, 420px);
		aspect-ratio: 1;
		margin: 0 auto;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid var(--border);
		box-shadow:
			0 0 0 6px rgba(61, 220, 151, 0.08),
			0 0 40px rgba(61, 220, 151, 0.15),
			var(--shadow);
	}

	.map {
		position: absolute;
		inset: 0;
	}

	.controls {
		position: absolute;
		right: 12%;
		bottom: 8%;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		z-index: 5;
	}

	.ctrl {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: rgba(16, 40, 51, 0.9);
		border: 1px solid var(--border);
		color: var(--text);
		font-size: 1.3rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(4px);
	}

	:global(.player-dot) {
		position: relative;
		width: 22px;
		height: 22px;
	}

	:global(.player-core) {
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		background: var(--aurora-teal);
		border: 2px solid #fff;
		box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
	}

	:global(.player-pulse) {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(56, 195, 216, 0.4);
		animation: pulse 2s ease-out infinite;
	}

	@keyframes pulse {
		0% { transform: scale(0.6); opacity: 0.9; }
		100% { transform: scale(2.4); opacity: 0; }
	}

	:global(.chest-marker) {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
		animation: bob 2.4s ease-in-out infinite;
	}

	@keyframes bob {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
</style>
