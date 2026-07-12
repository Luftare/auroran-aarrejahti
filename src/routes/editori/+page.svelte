<script lang="ts">
	// Chest-slot editor (dev tool): mark potential treasure locations
	// on the map, one level (layer) at a time. Saving writes the current
	// level's locations straight into the repository (src/lib/game/chests.ts)
	// via the dev server.
	//
	// Tap the map = add a location · drag a marker = move ·
	// tap a marker = remove · tabs switch the edited layer.

	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fi } from '$lib/fi';
	import { LEVELS, SLOTS_BY_LEVEL, type LevelId } from '$lib/game/chests';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import MapPin from '@lucide/svelte/icons/map-pin';

	type Draft = { lat: number; lng: number };

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let markers: maplibregl.Marker[] = [];
	// Each level keeps its own draft, so switching tabs never loses edits
	let level = $state<LevelId>('puutarha');
	let drafts = $state<Record<LevelId, Draft[]>>({
		puutarha: SLOTS_BY_LEVEL.puutarha.map((s) => ({ lat: s.lat, lng: s.lng })),
		metsa: SLOTS_BY_LEVEL.metsa.map((s) => ({ lat: s.lat, lng: s.lng })),
		seutu: SLOTS_BY_LEVEL.seutu.map((s) => ({ lat: s.lat, lng: s.lng }))
	});
	let dirtyByLevel = $state<Record<LevelId, boolean>>({
		puutarha: false,
		metsa: false,
		seutu: false
	});
	let saving = $state(false);
	let message = $state('');
	let messageOk = $state(true);

	function syncMarkers() {
		for (const marker of markers) marker.remove();
		markers = [];
		if (!map) return;
		drafts[level].forEach((slot, i) => {
			const el = document.createElement('button');
			el.className = 'slot-marker';
			el.textContent = String(i + 1);
			let dragged = false;
			const marker = new maplibregl.Marker({ element: el, draggable: true })
				.setLngLat([slot.lng, slot.lat])
				.addTo(map!);
			marker.on('dragstart', () => (dragged = true));
			marker.on('dragend', () => {
				const pos = marker.getLngLat();
				drafts[level][i] = { lat: pos.lat, lng: pos.lng };
				dirtyByLevel[level] = true;
				// the dragged flag is cleared only after the click (click follows dragend)
				setTimeout(() => (dragged = false), 0);
			});
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				if (dragged) return;
				drafts[level] = drafts[level].filter((_, idx) => idx !== i);
				dirtyByLevel[level] = true;
				syncMarkers();
			});
			markers.push(marker);
		});
	}

	function switchLevel(next: LevelId) {
		level = next;
		sessionStorage.setItem(LEVEL_KEY, next);
		syncMarkers();
	}

	// Saving writes chests.ts → HMR reloads the page. The map view and the
	// edited layer are kept in session storage so editing resumes from the
	// same position, zoom level and level tab.
	const VIEW_KEY = 'editori-nakyma';
	const LEVEL_KEY = 'editori-taso';

	function savedView(): { center: [number, number]; zoom: number } | null {
		try {
			const raw = sessionStorage.getItem(VIEW_KEY);
			if (!raw) return null;
			const view = JSON.parse(raw);
			if (typeof view.lng !== 'number' || typeof view.lat !== 'number' || typeof view.zoom !== 'number')
				return null;
			return { center: [view.lng, view.lat], zoom: view.zoom };
		} catch {
			return null;
		}
	}

	onMount(() => {
		const savedLevel = sessionStorage.getItem(LEVEL_KEY) as LevelId | null;
		if (savedLevel && LEVELS.includes(savedLevel)) level = savedLevel;
		const first = SLOTS_BY_LEVEL[level][0];
		const view = savedView();
		// The editor map keeps place names visible — locations are easier to pick
		map = new maplibregl.Map({
			container,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: view?.center ?? (first ? [first.lng, first.lat] : [24.7095, 60.2375]),
			zoom: view?.zoom ?? 14,
			attributionControl: { compact: true }
		});
		// Double-click zoom would fire two click events → two accidental
		// points; zoom with the wheel, pinch, or the +/- keys instead
		map.doubleClickZoom.disable();
		map.on('moveend', () => {
			if (!map) return;
			const center = map.getCenter();
			sessionStorage.setItem(
				VIEW_KEY,
				JSON.stringify({ lng: center.lng, lat: center.lat, zoom: map.getZoom() })
			);
		});
		map.on('click', (e) => {
			drafts[level] = [...drafts[level], { lat: e.lngLat.lat, lng: e.lngLat.lng }];
			dirtyByLevel[level] = true;
			syncMarkers();
		});
		map.on('load', syncMarkers);
	});

	onDestroy(() => map?.remove());

	async function save() {
		saving = true;
		message = '';
		try {
			const res = await fetch('/__editori/slotit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ level, slots: drafts[level] })
			});
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			dirtyByLevel[level] = false;
			message = fi.editorSaved(data.count);
			messageOk = true;
		} catch {
			message = fi.editorSaveFailed;
			messageOk = false;
		}
		saving = false;
		setTimeout(() => (message = ''), 4000);
	}
</script>

<svelte:head><title>{fi.editorTitle} — {fi.appName}</title></svelte:head>

<main>
	<div class="map" bind:this={container}></div>

	<header class="bar">
		<a class="chip" href="/" aria-label={fi.backToMap}><ArrowLeft size={18} /></a>
		<span class="chip title"><MapPin size={16} /> {fi.editorTitle} · {drafts[level].length}</span>
		<button class="btn btn-primary save" disabled={saving || !dirtyByLevel[level]} onclick={save}>
			{fi.editorSave}
		</button>
	</header>

	<!-- Layer tabs: each level's locations are edited separately -->
	<nav class="level-tabs">
		{#each LEVELS as id (id)}
			<button class="tab" class:active={id === level} onclick={() => switchLevel(id)}>
				{fi.levelName[id]}{#if dirtyByLevel[id]}&nbsp;•{/if}
			</button>
		{/each}
	</nav>

	<div class="hint">
		{#if message}
			<span class={messageOk ? 'ok' : 'error'}>{message}</span>
		{:else}
			{fi.editorHint}
		{/if}
	</div>
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		overflow: hidden;
	}

	.map {
		position: absolute;
		inset: 0;
	}

	.bar {
		position: absolute;
		top: calc(0.8rem + env(safe-area-inset-top));
		left: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		z-index: 10;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		background: var(--bg);
		color: var(--text);
		font-weight: 700;
		font-size: 0.95rem;
		text-decoration: none;
	}

	.title { margin-right: auto; }
	.save { padding: 0.5rem 1.1rem; }

	/* Layer tabs under the header; the active one is filled */
	.level-tabs {
		position: absolute;
		top: calc(4.2rem + env(safe-area-inset-top));
		left: 1rem;
		display: flex;
		gap: 0.4rem;
		z-index: 10;
	}

	.tab {
		padding: 0.4rem 0.85rem;
		border-radius: 999px;
		background: var(--bg);
		color: var(--muted);
		font-weight: 700;
		font-size: 0.9rem;
	}

	.tab.active {
		background: var(--aurora-green);
		color: #06222b;
	}

	.hint {
		position: absolute;
		left: 50%;
		bottom: calc(3rem + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		z-index: 10;
		max-width: min(88vw, 440px);
		padding: 0.55rem 1rem;
		border-radius: 999px;
		background: var(--bg);
		font-weight: 600;
		font-size: 0.9rem;
		text-align: center;
	}

	.ok { color: var(--aurora-green); }
	.error { color: var(--danger); }

	/* Numbered location marker */
	:global(.slot-marker) {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--gold);
		color: #3a2a00;
		font-weight: 800;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
</style>
