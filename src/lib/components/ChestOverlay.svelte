<script lang="ts">
	// Koko ruudun arkunavaus: napautukset tärähdyttävät koko näkymää,
	// kolmannella kamera sukeltaa avaimenreikään ja ruutu pimenee — kuin
	// sukeltaisi arkun sisään. Pimeydestä paljastuu päivän jalokivi.

	import { onDestroy, onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { createChest, type ChestRig } from './chest3d';
	import { createGemView, GEM_ORDER, type GemGalleryRig, type GemKind } from './gems3d';

	const TAPS_TO_OPEN = 3;
	const REWARD_AT_MS = 950; // ruutu on musta, kun näkymä vaihtuu
	const FADE_END_MS = 1600;

	let {
		streak,
		oncollect,
		onback
	}: {
		streak: number;
		/** Merkitsee arkun kerätyksi; palauttaa true jos päivän ensimmäinen. */
		oncollect: () => Promise<boolean>;
		onback: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let gemCanvas = $state<HTMLCanvasElement | null>(null);
	let rig: ChestRig | null = null;
	let gemRig: GemGalleryRig | null = null;
	let gemKind: GemKind = GEM_ORDER[Math.floor(Math.random() * GEM_ORDER.length)];
	let tapsDone = $state(0);
	let phase = $state<'tapping' | 'diving' | 'reward'>('tapping');
	let firstToday = $state(false);
	let fading = $state(false);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	onMount(() => {
		if (canvas) rig = createChest(canvas);
	});

	// Palkintokivi käynnistyy, kun sen canvas ilmestyy pimeyden alla
	$effect(() => {
		if (phase === 'reward' && gemCanvas && !gemRig) {
			gemRig = createGemView(gemCanvas, gemKind);
		}
	});

	onDestroy(() => {
		rig?.dispose();
		gemRig?.dispose();
		timeouts.forEach(clearTimeout);
	});

	async function tap() {
		if (phase !== 'tapping') return;
		tapsDone += 1;
		if (tapsDone >= TAPS_TO_OPEN) {
			navigator.vibrate?.([40, 60, 120]);
			firstToday = await oncollect();
			phase = 'diving';
			rig?.open();
			fading = true;
			timeouts.push(
				setTimeout(() => {
					// Ruutu on musta — arkku pois ja jalokivi tilalle
					phase = 'reward';
					rig?.dispose();
					rig = null;
				}, REWARD_AT_MS)
			);
			timeouts.push(setTimeout(() => (fading = false), FADE_END_MS));
		} else {
			rig?.tap();
			navigator.vibrate?.(20); // lyhyt ja terävä — vasaranisku
		}
	}
</script>

<div class="overlay">
	{#if phase !== 'reward'}
		<button class="stage" onclick={tap} aria-label={fi.tapToOpen}>
			<canvas bind:this={canvas}></canvas>
		</button>

		{#if phase === 'tapping'}
			<div class="prompt-area">
				<p class="prompt">{tapsDone === 0 ? fi.tapToOpen : fi.tapsLeft(TAPS_TO_OPEN - tapsDone)}</p>
				<div class="tap-dots">
					{#each Array(TAPS_TO_OPEN) as _, i}
						<span class="dot" class:filled={i < tapsDone}></span>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Palkinto: päivän jalokivi pimeydessä ja saalisteksti -->
		<div class="reward-view">
			<canvas class="gem" bind:this={gemCanvas}></canvas>
			<p class="reward">{fi.treasureFound}</p>
			{#if firstToday}
				<p class="streak-note">{streak === 1 ? fi.streakStarted : fi.streakContinues(streak)}</p>
			{/if}
			<button class="btn btn-primary" onclick={onback}>{fi.backToMap}</button>
		</div>
	{/if}

	{#if fading}
		<!-- Pimennys: sukellus avaimenreikään päättyy mustaan, joka väistyy
		     paljastaen palkintonäkymän -->
		<div class="fade" class:lift={phase === 'reward'}></div>
	{/if}
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--bg);
		animation: enter 220ms ease-out;
	}

	@keyframes enter {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Koko ruudun 3D-näyttämö — napautus mihin tahansa osuu arkkuun */
	.stage {
		position: absolute;
		inset: 0;
		padding: 0;
		cursor: pointer;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.prompt-area {
		position: absolute;
		left: 0;
		right: 0;
		bottom: calc(14% + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.7rem;
		pointer-events: none;
	}

	.prompt {
		font-weight: 600;
		font-size: 1.1rem;
		margin: 0;
	}

	.tap-dots {
		display: flex;
		gap: 0.4rem;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--bg-high);
		transition: background 150ms ease;
	}

	.dot.filled {
		background: var(--gold);
	}

	/* Pimennys sukelluksen loppuun: syvenee mustaan ja hälvenee palkinnon päältä */
	.fade {
		position: absolute;
		inset: 0;
		z-index: 5;
		background: #000;
		opacity: 0;
		animation: sink 0.55s ease-in 0.45s forwards;
		pointer-events: none;
	}

	.fade.lift {
		opacity: 1;
		animation: lift 0.5s ease-out 0.1s forwards;
	}

	@keyframes sink {
		to { opacity: 1; }
	}

	@keyframes lift {
		to { opacity: 0; }
	}

	.reward-view {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 2rem;
		text-align: center;
		background: #060b10; /* syvä pimeys jalokiven ympärillä */
	}

	.reward-view .gem {
		width: min(88vw, 380px);
		height: min(88vw, 380px);
	}

	.reward {
		font-size: 2rem;
		font-weight: 800;
		color: var(--gold);
		margin: 0;
		animation: rise 600ms ease-out both;
	}

	.streak-note {
		color: var(--aurora-green);
		font-weight: 700;
		font-size: 1.15rem;
		margin: 0;
		animation: rise 600ms 150ms ease-out both;
	}

	.reward-view .btn {
		margin-top: 1.4rem;
		animation: rise 600ms 300ms ease-out both;
	}

	@keyframes rise {
		from { opacity: 0; transform: translateY(14px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
