<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fi } from '$lib/fi';
	import { distanceM } from '$lib/geo';
	import type { Chest } from '$lib/game/chests';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		chests = [] as Chest[],
		level = '',
		playerLat = null as number | null,
		playerLng = null as number | null,
		heading = null as number | null,
		inRangeId = null as string | null,
		onchestclick
	}: {
		chests: Chest[];
		/** Current area id — a change re-fits the camera to the new chest set. */
		level?: string;
		playerLat: number | null;
		playerLng: number | null;
		/** Device compass heading (deg from north); null hides the cone. */
		heading?: number | null;
		inRangeId: string | null;
		onchestclick: (id: string) => void;
	} = $props();

	const DEFAULT_CENTER: [number, number] = [24.7095, 60.2375]; // center of the play area

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let playerMarker: maplibregl.Marker | null = null;
	let chestMarkers = new Map<string, maplibregl.Marker>();
	// The map opens as an overview of all of the day's chests ("where are
	// today's treasures?"), so the camera starts in the panned state and
	// follows the player only after they tap recenter.
	let panned = $state(true);
	let fittedToChests = false;
	let fittedLevel = '';

	// Speech bubble: tapping a treasure tells how far away it is. The tapped
	// chest rises to the top of the chest z-order; tapping anywhere else
	// dismisses the bubble.
	let bubbleId = $state<string | null>(null);
	let bubbleMarker: maplibregl.Marker | null = null;
	let bubbleTextEl: HTMLElement | null = null;

	// Off-screen treasures show as small half-dots hugging the screen edges.
	// A chest beyond a corner gets a hint on both adjacent edges.
	type EdgeHint = { key: string; edge: 'top' | 'bottom' | 'left' | 'right'; pos: number };
	let edgeHints = $state<EdgeHint[]>([]);
	function updateEdgeHints(): void {
		if (!map) return;
		const w = container.clientWidth;
		const h = container.clientHeight;
		const hints: EdgeHint[] = [];
		for (const chest of chests) {
			if (chest.looted) continue;
			const p = map.project([chest.lng, chest.lat]);
			if (p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h) continue;
			// May slide to the very corner; the overflow clips to a quarter-dot
			const x = Math.min(Math.max(p.x, 0), w);
			const y = Math.min(Math.max(p.y, 0), h);
			if (p.x < 0) hints.push({ key: `${chest.id}-l`, edge: 'left', pos: y });
			else if (p.x > w) hints.push({ key: `${chest.id}-r`, edge: 'right', pos: y });
			if (p.y < 0) hints.push({ key: `${chest.id}-t`, edge: 'top', pos: x });
			else if (p.y > h) hints.push({ key: `${chest.id}-b`, edge: 'bottom', pos: x });
		}
		edgeHints = hints;
	}

	// Image rendered from the 3D chest model (static/arkku.png)
	const CHEST_IMG = '<img src="/arkku.png" alt="" width="34" height="34" draggable="false" />';

	onMount(() => {
		map = new maplibregl.Map({
			container,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: DEFAULT_CENTER,
			zoom: 14,
			attributionControl: { compact: true }
		});
		map.on('dragstart', () => (panned = true));
		// 'move' fires throughout pans, zooms and camera animations
		map.on('move', updateEdgeHints);
		// Tapping anywhere but a chest dismisses the distance bubble
		// (chest marker clicks stop propagation and never reach here)
		map.on('click', () => (bubbleId = null));
		map.touchPitch.disable();
		// Place names and map symbols are stripped from the game map, but
		// street names are kept visible — they help navigate to the chests.
		map.on('style.load', () => {
			if (!map) return;
			for (const layer of [...map.getStyle().layers]) {
				if (layer.type === 'symbol' && !layer.id.startsWith('highway-name')) {
					map.removeLayer(layer.id);
				}
			}
		});
	});

	onDestroy(() => map?.remove());

	// Initial view: centered on the day's treasures and zoomed so they all
	// fit with only the padding the floating UI needs — no extra margin.
	// Runs once per area — switching the level re-fits the camera.
	// The zoom cap only guards the degenerate case of near-coincident chests.
	$effect(() => {
		if (!map || chests.length === 0) return;
		if (fittedToChests && level === fittedLevel) return;
		fittedToChests = true;
		fittedLevel = level;
		const targets = chests.filter((c) => !c.looted);
		const bounds = new maplibregl.LngLatBounds();
		for (const c of targets.length > 0 ? targets : chests) bounds.extend([c.lng, c.lat]);
		try {
			map.fitBounds(bounds, {
				padding: { top: 90, bottom: 120, left: 44, right: 44 },
				duration: 0,
				maxZoom: 17
			});
		} catch {
			// The padding does not fit a very small viewport — fall back to a smaller one
			map.fitBounds(bounds, { padding: 24, duration: 0, maxZoom: 17 });
		}
	});

	// Player location marker — the camera follows only after a recenter tap.
	// The heading cone lives on an inner element (never transform the
	// MapLibre marker root) and rotates with the device compass.
	let headingEl: HTMLElement | null = null;

	function updateHeadingCone(): void {
		if (!headingEl) return;
		if (heading == null) {
			headingEl.style.opacity = '0';
		} else {
			headingEl.style.opacity = '1';
			headingEl.style.transform = `rotate(${heading - (map?.getBearing() ?? 0)}deg)`;
		}
	}

	$effect(() => {
		if (!map || playerLat == null || playerLng == null) return;
		if (!playerMarker) {
			const el = document.createElement('div');
			el.className = 'player-dot';
			el.innerHTML =
				'<div class="player-pulse"></div><div class="player-heading"><div class="player-cone"></div></div><div class="player-core"></div>';
			headingEl = el.querySelector('.player-heading');
			playerMarker = new maplibregl.Marker({ element: el }).setLngLat([playerLng, playerLat]).addTo(map);
			updateHeadingCone();
		} else {
			playerMarker.setLngLat([playerLng, playerLat]);
		}
		if (!panned) {
			map.setCenter([playerLng, playerLat]);
		}
	});

	// The cone follows the compass (and the map bearing, would it ever rotate)
	$effect(() => {
		void heading;
		updateHeadingCone();
	});

	// Chests as circular thumbnails — collected ones disappear from the map
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
			const el = document.createElement('button');
			el.className = 'chest-thumb';
			el.classList.toggle('in-range', chest.id === inRangeId);
			el.setAttribute('aria-label', fi.tapToOpen);
			// Animations and positioning live on inner elements: changing transform
			// or position on the root element would break MapLibre's placement.
			// Structure: centered shadow (lying on the ground) + outward-radiating
			// sparks (cf. the green gem effect) + ring + chest image.
			// Two batches of sparks: small dots and spinning four-pointed stars
			const spark = (cls: string) => {
				const angle = Math.random() * Math.PI * 2;
				const dist = 44 + Math.random() * 18;
				const dur = (1.8 + Math.random()).toFixed(2);
				const delay = (Math.random() * 2.5).toFixed(2);
				return `<span class="${cls}" style="--dx:${(Math.cos(angle) * dist).toFixed(1)}px;--dy:${(Math.sin(angle) * dist).toFixed(1)}px;animation-duration:${dur}s;animation-delay:${delay}s"></span>`;
			};
			const sparks =
				Array.from({ length: 8 }, () => spark('chest-spark')).join('') +
				Array.from({ length: 5 }, () => spark('chest-spark star')).join('');
			el.innerHTML = `<span class="chest-thumb-inner"><span class="chest-thumb-ground"></span>${sparks}<span class="chest-thumb-ring"><span class="chest-thumb-face">${CHEST_IMG}</span></span></span>`;
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				if (chest.id === inRangeId) {
					// In range: open the chest as before
					bubbleId = null;
					onchestclick(chest.id);
				} else {
					// Out of range: the chest tells how far away it is
					bubbleId = chest.id;
				}
			});
			chestMarkers.set(
				chest.id,
				new maplibregl.Marker({ element: el }).setLngLat([chest.lng, chest.lat]).addTo(map)
			);
		}
		// Chest set changed (day rolled over, a chest was looted) — refresh the hints
		updateEdgeHints();
	});

	// The chest within range is highlighted. The dependency is read before
	// the loop: the marker map may be empty on the first run, and the
	// effect would otherwise never register inRangeId at all.
	$effect(() => {
		const active = inRangeId;
		for (const [id, marker] of chestMarkers) {
			marker.getElement().classList.toggle('in-range', id === active);
		}
	});

	// The distance bubble follows the tapped chest and updates live as the
	// player walks. The tapped chest rises above its siblings in z-order.
	$effect(() => {
		const chest = bubbleId ? chests.find((c) => c.id === bubbleId && !c.looted) : null;
		for (const [id, marker] of chestMarkers) {
			marker.getElement().classList.toggle('topmost', id === bubbleId);
		}
		if (!map || !chest || playerLat == null || playerLng == null) {
			bubbleMarker?.remove();
			bubbleMarker = null;
			bubbleTextEl = null;
			return;
		}
		if (!bubbleMarker) {
			const el = document.createElement('div');
			el.className = 'chest-bubble';
			el.innerHTML = '<span class="chest-bubble-inner"></span>';
			bubbleTextEl = el.querySelector('.chest-bubble-inner');
			bubbleMarker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -36] })
				.setLngLat([chest.lng, chest.lat])
				.addTo(map);
		} else {
			bubbleMarker.setLngLat([chest.lng, chest.lat]);
		}
		const dist = distanceM(playerLat, playerLng, chest.lat, chest.lng);
		bubbleTextEl!.textContent = fi.chestDistance(fi.formatDistance(dist));
	});

	function recenter() {
		if (map && playerLat != null && playerLng != null) {
			map.easeTo({ center: [playerLng, playerLat], zoom: 15 });
			panned = false;
		}
	}
</script>

<div class="map" bind:this={container}></div>

<!-- Direction hints for off-screen treasures: half-capsules at the edges -->
{#each edgeHints as hint (hint.key)}
	{#if hint.edge === 'top' || hint.edge === 'bottom'}
		<span class="edge-hint {hint.edge}" style:left="{hint.pos}px"></span>
	{:else}
		<span class="edge-hint {hint.edge}" style:top="{hint.pos}px"></span>
	{/if}
{/each}

<div class="controls">
	{#if panned && playerLat != null}
		<button class="ctrl" onclick={recenter} aria-label={fi.recenter}><LocateFixed size={18} /></button>
	{/if}
	<button class="ctrl" onclick={() => map?.zoomIn()} aria-label={fi.zoomIn}><Plus size={18} /></button>
	<button class="ctrl" onclick={() => map?.zoomOut()} aria-label={fi.zoomOut}><Minus size={18} /></button>
</div>

<style>
	.map {
		position: absolute;
		inset: 0;
	}

	/* Above the status row so the bottom button doesn't hide beneath it */
	.controls {
		position: absolute;
		right: 1rem;
		bottom: calc(5rem + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 10;
	}

	.ctrl {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(16, 40, 51, 0.9);
		color: var(--text);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Off-screen treasure hints: small half-dots flush against the screen
	   edge, in the UI element color. Flat side sits on the edge. Stacked
	   below the map markers: a chest sliding in over the edge covers its
	   own hint. */
	:global(.map .maplibregl-marker) {
		z-index: 5;
	}

	/* The tapped chest rises above its siblings; its bubble above everything */
	:global(.map .maplibregl-marker.topmost) {
		z-index: 6;
	}

	:global(.map .maplibregl-marker.chest-bubble) {
		z-index: 7;
		pointer-events: none;
	}

	/* Speech bubble: a dark pill with a tip pointing at the chest. The pop
	   animation lives on the inner element — never transform a marker root. */
	:global(.chest-bubble-inner) {
		position: relative;
		display: block;
		padding: 0.45rem 0.85rem;
		border-radius: 999px;
		background: var(--bg);
		color: var(--text);
		font-weight: 700;
		font-size: 0.92rem;
		white-space: nowrap;
		animation: bubble-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		transform-origin: 50% 100%;
	}

	:global(.chest-bubble-inner::after) {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -6px;
		transform: translateX(-50%);
		border: 7px solid transparent;
		border-top-color: var(--bg);
		border-bottom: none;
	}

	@keyframes bubble-pop {
		from {
			transform: scale(0.4);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.edge-hint {
		position: absolute;
		z-index: 4;
		pointer-events: none;
		background: var(--bg-high);
	}

	.edge-hint.top,
	.edge-hint.bottom {
		width: 14px;
		height: 7px;
		transform: translateX(-50%);
	}

	.edge-hint.left,
	.edge-hint.right {
		width: 7px;
		height: 14px;
		transform: translateY(-50%);
	}

	.edge-hint.top {
		top: 0;
		border-radius: 0 0 999px 999px;
	}

	.edge-hint.bottom {
		bottom: 0;
		border-radius: 999px 999px 0 0;
	}

	.edge-hint.left {
		left: 0;
		border-radius: 0 999px 999px 0;
	}

	.edge-hint.right {
		right: 0;
		border-radius: 999px 0 0 999px;
	}

	/* Chest as a circular thumbnail on the map: floats above its shadow,
	   circled by a glowing gold ring — precious and enticing */
	:global(.chest-thumb) {
		cursor: pointer;
		line-height: 0;
	}

	:global(.chest-thumb-inner) {
		position: relative;
		display: block;
	}

	/* Ring in the same color as the other UI buttons — the marker fits the
	   rest of the interface; the gold background makes the chest precious */
	:global(.chest-thumb-ring) {
		position: relative;
		display: block;
		width: 52px;
		height: 52px;
		padding: 3px;
		border-radius: 50%;
		background: var(--bg-high);
	}

	:global(.chest-thumb-face) {
		position: relative;
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: var(--gold);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden; /* the glint sweep is clipped to the circle */
	}

	/* In range: the treasure pops to 1.5× and wiggles gently every now and
	   then — like a Christmas present being shaken with curiosity. A glint
	   sweeping over the gold in time with the wiggle invites opening. */
	:global(.chest-thumb.in-range .chest-thumb-ring) {
		animation:
			present-pop 0.35s ease-out forwards,
			present-shake 2.2s 0.35s ease-in-out infinite;
	}

	:global(.chest-thumb.in-range .chest-thumb-ground) {
		transform: translateY(11px) scale(1.35);
	}

	:global(.chest-thumb.in-range .chest-thumb-face::after) {
		content: '';
		position: absolute;
		top: -20%;
		left: -70%;
		width: 45%;
		height: 140%;
		background: linear-gradient(
			105deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0.8) 50%,
			rgba(255, 255, 255, 0) 100%
		);
		transform: skewX(-18deg);
		animation: glint 2.2s 0.35s ease-in-out infinite;
	}

	/* Shadow: smaller than the marker and shifted slightly downward — peeks
	   out from behind and below the chest, as if the marker hovered just above the ground */
	:global(.chest-thumb-ground) {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 44px;
		height: 44px;
		margin: -22px 0 0 -22px;
		transform: translateY(8px);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(6, 10, 14, 0.45) 45%, rgba(6, 10, 14, 0) 72%);
	}

	/* Outward-radiating sparks: small sharp dots that rise from behind
	   the marker and fade along the way — same effect as on the gems.
	   Same color as the ring. */
	:global(.chest-spark) {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 4px;
		height: 4px;
		margin: -2px;
		border-radius: 50%;
		background: var(--bg-high);
		opacity: 0;
		animation: chest-spark linear infinite;
		pointer-events: none;
	}

	@keyframes chest-spark {
		0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
		60% { opacity: 0.85; }
		100% { transform: translate(var(--dx), var(--dy)) scale(0.55); opacity: 0; }
	}

	/* Second batch: four-pointed stars that spin as they fly */
	:global(.chest-spark.star) {
		width: 9px;
		height: 9px;
		margin: -4.5px;
		border-radius: 0;
		clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
		animation-name: chest-spark-star;
	}

	@keyframes chest-spark-star {
		0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 0.9; }
		60% { opacity: 0.85; }
		100% { transform: translate(var(--dx), var(--dy)) rotate(160deg) scale(0.5); opacity: 0; }
	}


	/* Arrival: a small overshoot before settling at 1.5× size */
	@keyframes present-pop {
		0% { transform: scale(1); }
		60% { transform: scale(1.64); }
		100% { transform: scale(1.5); }
	}

	/* Mostly at rest; a short gentle wiggle near the end of the cycle */
	@keyframes present-shake {
		0%, 55% { transform: scale(1.5) rotate(0deg); }
		61% { transform: scale(1.5) rotate(-6deg); }
		67% { transform: scale(1.5) rotate(5deg); }
		73% { transform: scale(1.5) rotate(-4deg); }
		79% { transform: scale(1.5) rotate(2deg); }
		85%, 100% { transform: scale(1.5) rotate(0deg); }
	}

	/* The glint sweeps over the gold in time with the wiggle */
	@keyframes glint {
		0%, 52% { left: -70%; }
		78%, 100% { left: 130%; }
	}

	/* The white ring is for map-marker legibility against the map base,
	   not UI decoration. The marker uses the UI element color. */
	:global(.player-dot) {
		position: relative;
		width: 22px;
		height: 22px;
	}

	:global(.player-core) {
		position: absolute;
		inset: 4px;
		border-radius: 50%;
		background: var(--bg-high);
		border: 2px solid #fff;
	}

	:global(.player-pulse) {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(31, 68, 84, 0.45);
		animation: pulse 2s ease-out infinite;
	}

	/* Compass heading: a fading beam showing where the device is facing.
	   Rotates around the dot center; hidden while there is no heading. */
	:global(.player-heading) {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 300ms ease;
		pointer-events: none;
	}

	:global(.player-cone) {
		position: absolute;
		left: 50%;
		bottom: 50%;
		width: 36px;
		height: 30px;
		transform: translateX(-50%);
		clip-path: polygon(50% 100%, 0 0, 100% 0);
		background: linear-gradient(to top, rgba(31, 68, 84, 0.7), rgba(31, 68, 84, 0));
	}

	@keyframes pulse {
		0% { transform: scale(0.6); opacity: 0.9; }
		100% { transform: scale(2.4); opacity: 0; }
	}
</style>
