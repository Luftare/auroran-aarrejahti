<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fi } from '$lib/fi';
	import type { Chest } from '$lib/game/chests';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		chests = [] as Chest[],
		playerLat = null as number | null,
		playerLng = null as number | null,
		inRangeId = null as string | null,
		onchestclick
	}: {
		chests: Chest[];
		playerLat: number | null;
		playerLng: number | null;
		inRangeId: string | null;
		onchestclick: (id: string) => void;
	} = $props();

	const DEFAULT_CENTER: [number, number] = [24.7095, 60.2375]; // pelialueen keskellä

	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let playerMarker: maplibregl.Marker | null = null;
	let chestMarkers = new Map<string, maplibregl.Marker>();
	let panned = $state(false);
	let centeredOnce = false;

	// 3D-arkkumallista renderöity kuva (static/arkku.png)
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
		map.touchPitch.disable();
		// Pelikartalta karsitaan paikannimet ja karttasymbolit, mutta
		// kadunnimet jätetään näkyviin — ne auttavat suunnistamaan arkuille.
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

	// Pelaajan sijaintimerkki — kamera seuraa, kunnes pelaaja panoroi itse
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
		} else if (!panned) {
			map.setCenter([playerLng, playerLat]);
		}
	});

	// Arkut ympyräthumbnaileina — kerätyt poistuvat kartalta
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
			// Animaatiot ja asemointi sisemmissä elementeissä: transform- tai
			// position-muutos juurielementissä rikkoisi MapLibren sijoittelun.
			// Rakenne: keskitetty varjo (makaa maassa) + ulospäin säteilevät
			// kipinät (vrt. vihreän jalokiven efekti) + reunus + arkkukuva.
			// Kaksi kipinäerää: pieniä täpliä ja pyörähteleviä nelisakaraisia tähtiä
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
				onchestclick(chest.id);
			});
			chestMarkers.set(
				chest.id,
				new maplibregl.Marker({ element: el }).setLngLat([chest.lng, chest.lat]).addTo(map)
			);
		}
	});

	// Kantaman sisällä oleva arkku korostuu. Riippuvuus luetaan ennen
	// silmukkaa: markkerikartta voi olla tyhjä ensimmäisellä ajolla, eikä
	// efekti muuten rekisteröisi inRangeId:tä lainkaan.
	$effect(() => {
		const active = inRangeId;
		for (const [id, marker] of chestMarkers) {
			marker.getElement().classList.toggle('in-range', id === active);
		}
	});

	function recenter() {
		if (map && playerLat != null && playerLng != null) {
			map.easeTo({ center: [playerLng, playerLat], zoom: 15 });
			panned = false;
		}
	}
</script>

<div class="map" bind:this={container}></div>

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

	/* Tilarivin yläpuolella, ettei alin painike jää sen alle */
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

	/* Arkku ympyräthumbnailina kartalla: leijuu varjonsa yllä ja sitä
	   kiertää hohtava kultareunus — arvokas ja houkutteleva */
	:global(.chest-thumb) {
		cursor: pointer;
		line-height: 0;
	}

	:global(.chest-thumb-inner) {
		position: relative;
		display: block;
	}

	/* Reunus samaa väriä kuin muut UI-napit — merkki istuu muuhun
	   käyttöliittymään; kultatausta nostaa arkun arvokkaaksi */
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
		overflow: hidden; /* kiiltopyyhkäisy leikkautuu ympyrään */
	}

	/* Kantamassa: aarre pomppaa 1,5-kertaiseksi ja heiluu silloin tällöin
	   varovasti — kuin joululahja, jota ravistellaan uteliaana. Kullan yli
	   pyyhkäisevä kiilto heilautuksen tahdissa kutsuu avaamaan. */
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

	/* Varjo: merkkiä pienempi ja hieman alaspäin siirretty — pilkistää
	   arkun takaa ja alta, kuin merkki kohoaisi aavistuksen maasta */
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

	/* Ulospäin säteilevät kipinät: pieniä teräviä täpliä, jotka nousevat
	   merkin takaa ja haipuvat matkalla — sama efekti kuin jalokivillä.
	   Väri sama kuin reunuksella. */
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

	/* Toinen erä: nelisakaraiset tähdet, jotka pyörähtävät lentäessään */
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


	/* Saapuminen: pieni ylitys ennen asettumista 1,5-kokoon */
	@keyframes present-pop {
		0% { transform: scale(1); }
		60% { transform: scale(1.64); }
		100% { transform: scale(1.5); }
	}

	/* Enimmäkseen levossa; lyhyt hento heilautus kierroksen lopulla */
	@keyframes present-shake {
		0%, 55% { transform: scale(1.5) rotate(0deg); }
		61% { transform: scale(1.5) rotate(-6deg); }
		67% { transform: scale(1.5) rotate(5deg); }
		73% { transform: scale(1.5) rotate(-4deg); }
		79% { transform: scale(1.5) rotate(2deg); }
		85%, 100% { transform: scale(1.5) rotate(0deg); }
	}

	/* Kiilto pyyhkäisee kullan yli heilautuksen aikaan */
	@keyframes glint {
		0%, 52% { left: -70%; }
		78%, 100% { left: 130%; }
	}

	/* Valkoinen rengas on karttamerkin luettavuutta karttapohjaa vasten,
	   ei käyttöliittymän koristelua */
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
</style>
