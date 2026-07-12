<script lang="ts">
	// Area preview for the onboarding's "Valitse alue" step: a non-interactive
	// map showing the day's treasures of the toggled level. Switching the
	// level animates the camera to fit the new chest set.
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { currentDay, dailySlots, type LevelId } from '$lib/game/chests';

	let { level }: { level: LevelId } = $props();

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let loaded = $state(false);
	let markers: maplibregl.Marker[] = [];

	onMount(() => {
		map = new maplibregl.Map({
			container,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: [24.7095, 60.2375],
			zoom: 13,
			interactive: false,
			attributionControl: { compact: true }
		});
		// Same treatment as the game map: only street names stay visible
		map.on('style.load', () => {
			if (!map) return;
			for (const layer of [...map.getStyle().layers]) {
				if (layer.type === 'symbol' && !layer.id.startsWith('highway-name')) {
					map.removeLayer(layer.id);
				}
			}
		});
		map.on('load', () => (loaded = true));
	});

	onDestroy(() => map?.remove());

	// The level's treasures as markers; the camera glides to fit them
	$effect(() => {
		if (!map) return;
		void loaded; // re-run once the map is ready so the first fit lands
		const slots = dailySlots(currentDay(), level);
		for (const m of markers) m.remove();
		markers = slots.map((s) => {
			const el = document.createElement('div');
			el.className = 'preview-chest';
			el.innerHTML = '<img src="/arkku.png" alt="" width="22" height="22" draggable="false" />';
			return new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map!);
		});
		if (slots.length === 0) return;
		const bounds = new maplibregl.LngLatBounds();
		for (const s of slots) bounds.extend([s.lng, s.lat]);
		try {
			map.fitBounds(bounds, { padding: 44, duration: 700, maxZoom: 16.5 });
		} catch {
			map.fitBounds(bounds, { padding: 16, duration: 700, maxZoom: 16.5 });
		}
	});
</script>

<div class="map" bind:this={container}></div>

<style>
	.map {
		position: absolute;
		inset: 0;
	}

	/* Miniature treasure marker, in the game's marker style */
	:global(.preview-chest) {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--gold);
		border: 3px solid var(--bg-high);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	:global(.preview-chest img) {
		display: block;
	}
</style>
