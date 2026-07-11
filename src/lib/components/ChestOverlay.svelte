<script lang="ts">
	// Full-screen chest opening: taps shake the view and can raise the
	// loot multiplier (x1–x5) — the background changes color by level.
	// After three taps, "Näytä aarteet!" dives into the keyhole
	// and the loot is revealed out of the darkness.

	import { onDestroy, onMount } from 'svelte';
	import Flame from '@lucide/svelte/icons/flame';
	import { fi } from '$lib/fi';
	import type { CollectResult, Loot } from '$lib/game/state.svelte';
	import { createChest, type ChestRig } from './chest3d';
	import { createGemView, GEM_ORDER, type GemKind } from './gems3d';

	const TAPS_TO_OPEN = 3;
	const REWARD_AT_MS = 950; // screen is black when the view switches
	const FADE_END_MS = 1600;
	const MAX_MULT = 5;
	const UPGRADE_ONE = 0.2; // +1 level / tap
	const UPGRADE_TWO = 0.05; // +2 levels / tap

	/** Backgrounds and accent colors for the multiplier levels: black → green →
	 *  blue → violet → orange */
	const LEVELS: Record<number, { bg: string; accent: string }> = {
		1: { bg: '#05080c', accent: '#eaf4f4' },
		2: { bg: '#0a3620', accent: '#3ddc97' },
		3: { bg: '#0b2a52', accent: '#3aa8ff' },
		4: { bg: '#2c1354', accent: '#a66bff' },
		5: { bg: '#40220a', accent: '#ff9d2e' }
	};

	let {
		streak,
		oncollect,
		onback
	}: {
		streak: number;
		/** Marks the chest collected with the multiplier; returns the loot. */
		oncollect: (multiplier: number) => Promise<CollectResult>;
		onback: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let rig: ChestRig | null = null;
	let loot = $state<Loot>({});
	// Loot one gem at a time, from most common to rarest — best one last
	const queue = $derived(
		GEM_ORDER.flatMap((kind) => Array.from({ length: loot[kind] ?? 0 }, () => kind))
	);
	let rewardIndex = $state(0);
	let tapsDone = $state(0);
	let multiplier = $state(1);
	let multPopKey = $state(0); // a new value restarts the pop animation
	let phase = $state<'tapping' | 'ready' | 'diving' | 'reward' | 'streak'>('tapping');
	let firstToday = $state(false);
	let fading = $state(false);
	let timeouts: ReturnType<typeof setTimeout>[] = [];

	onMount(() => {
		if (canvas) rig = createChest(canvas);
	});

	onDestroy(() => {
		rig?.dispose();
		timeouts.forEach(clearTimeout);
	});

	/** Svelte action: the loot gem's 3D view lives with its canvas.
	 *  Intro: the gem arrives as a black silhouette and gains its color at the end. */
	function gemview(el: HTMLCanvasElement, kind: GemKind) {
		const gemRig = createGemView(el, kind, { intro: true });
		return { destroy: () => gemRig.dispose() };
	}

	/** Advance by tapping anywhere (or the CTA): next gem,
	 *  then the streak view if this is the day's first collection, finally back to the map. */
	function advance() {
		navigator.vibrate?.(10);
		if (rewardIndex < queue.length - 1) {
			rewardIndex += 1;
		} else if (firstToday && phase === 'reward') {
			phase = 'streak';
		} else {
			onback();
		}
	}

	// Streak view circles: a week row where today's circle fills in
	const STREAK_ROW = 7;
	const todayIdx = $derived(Math.max(0, (streak - 1) % STREAK_ROW));

	// Star burst from today's circle: directions, sizes and delays are randomized once
	const CONFETTI_COLORS = [
		'var(--gold)',
		'var(--aurora-green)',
		'var(--aurora-teal)',
		'var(--aurora-violet)',
		'#ff9d2e'
	];
	const confetti = Array.from({ length: 14 }, (_, i) => {
		const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
		const dist = 30 + Math.random() * 34;
		return {
			dx: Math.cos(angle) * dist,
			dy: Math.sin(angle) * dist,
			rot: -180 + Math.random() * 360,
			size: 5 + Math.random() * 4,
			delay: 0.8 + Math.random() * 0.2,
			star: i % 2 === 0,
			color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
		};
	});

	function tap() {
		if (phase === 'ready') {
			// Upgrades are used up — tapping the chest acts like the CTA
			reveal();
			return;
		}
		if (phase !== 'tapping') return;
		tapsDone += 1;
		rig?.tap();

		// Every tap can raise the loot multiplier
		const r = Math.random();
		const steps = r < UPGRADE_TWO ? 2 : r < UPGRADE_TWO + UPGRADE_ONE ? 1 : 0;
		if (steps > 0 && multiplier < MAX_MULT) {
			multiplier = Math.min(MAX_MULT, multiplier + steps);
			multPopKey += 1;
			navigator.vibrate?.([25, 30, 45]); // the upgrade is felt in the fingers
		} else {
			navigator.vibrate?.(20); // short and sharp — a hammer blow
		}

		if (tapsDone >= TAPS_TO_OPEN) phase = 'ready';
	}

	async function reveal() {
		if (phase !== 'ready') return;
		navigator.vibrate?.([40, 60, 120]);
		const result = await oncollect(multiplier);
		firstToday = result.firstToday;
		loot = result.loot;
		phase = 'diving';
		rig?.open();
		fading = true;
		timeouts.push(
			setTimeout(() => {
				// The screen is black — swap the chest out for the loot
				phase = 'reward';
				rig?.dispose();
				rig = null;
			}, REWARD_AT_MS)
		);
		timeouts.push(setTimeout(() => (fading = false), FADE_END_MS));
	}
</script>

<div class="overlay" style:background={LEVELS[multiplier].bg}>
	{#if phase === 'tapping' || phase === 'ready' || phase === 'diving'}
		<button class="stage" onclick={tap} aria-label={fi.tapToOpen}>
			<canvas bind:this={canvas}></canvas>
		</button>

		<!-- Loot multiplier: persistent badge and the upgrade pop effect -->
		{#if multiplier > 1 && phase !== 'diving'}
			<span class="mult-chip" style:color={LEVELS[multiplier].accent}>×{multiplier}</span>
		{/if}
		{#key multPopKey}
			{#if multPopKey > 0 && phase !== 'diving'}
				<span class="mult-pop" style:color={LEVELS[multiplier].accent}>×{multiplier}</span>
			{/if}
		{/key}

		{#if phase === 'tapping'}
			<div class="prompt-area">
				<p class="prompt">{fi.tapToOpen}</p>
				<div class="tap-dots">
					{#each Array(TAPS_TO_OPEN) as _, i}
						<span class="dot" class:filled={i < tapsDone}></span>
					{/each}
				</div>
			</div>
		{:else if phase === 'ready'}
			<div class="prompt-area">
				<button class="btn btn-gold reveal-cta" onclick={reveal}>{fi.showLoot}</button>
			</div>
		{/if}
	{:else if phase === 'reward'}
		<!-- Loot one gem at a time — tapping anywhere continues -->
		<button class="reward-view" onclick={advance}>
			{#key rewardIndex}
				<canvas class="gem" use:gemview={queue[rewardIndex]}></canvas>
			{/key}
			<p class="reward">{fi.treasureFound}</p>
			{#if queue.length > 1}
				<div class="tap-dots">
					{#each queue as _, i}
						<span class="dot" class:filled={i <= rewardIndex}></span>
					{/each}
				</div>
			{/if}
			<span class="btn btn-primary cta">
				{rewardIndex < queue.length - 1 || firstToday ? fi.next : fi.backToMap}
			</span>
		</button>
	{:else if phase === 'streak'}
		<!-- The day's first collection: streak celebration. Today's circle fills
		     with a flame and a star burst, and the hunter meter accelerates from
		     zero to tomorrow's streak-based bonus. -->
		<button class="reward-view streak-view" onclick={onback}>
			<div class="streak-hero-group">
				<div class="streak-hero">
					<Flame size={44} color="var(--gold)" fill="var(--gold)" />
					<span class="streak-count">{streak}</span>
				</div>
				<p class="streak-hero-label">{fi.streakDays}</p>
			</div>

			<div class="streak-row">
				{#each Array(STREAK_ROW) as _, i}
					<div class="streak-day">
						<span class="streak-circle" class:filled={i < todayIdx} class:today={i === todayIdx}>
							{#if i === todayIdx}
								<span class="streak-flame">
									<Flame size={18} color="var(--bg)" fill="var(--bg)" />
								</span>
								{#each confetti as p}
									<span
										class="confetti"
										class:star={p.star}
										style:--dx="{p.dx}px"
										style:--dy="{p.dy}px"
										style:--rot="{p.rot}deg"
										style:--s="{p.size}px"
										style:--d="{p.delay}s"
										style:background={p.color}
									></span>
								{/each}
							{/if}
						</span>
						<span class="streak-num" class:reached={i <= todayIdx}>{streak - todayIdx + i}</span>
					</div>
				{/each}
			</div>

			<span class="btn btn-primary cta">{fi.backToMap}</span>
		</button>
	{/if}

	{#if fading}
		<!-- Blackout: the dive into the keyhole ends in black, which recedes
		     to reveal the reward view -->
		<div class="fade" class:lift={phase === 'reward'}></div>
	{/if}
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: #05080c;
		transition: background 450ms ease;
		animation: enter 220ms ease-out;
	}

	@keyframes enter {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Full-screen 3D stage — a tap anywhere hits the chest */
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

	.reveal-cta {
		padding: 0.9rem 2.2rem;
		font-size: 1.15rem;
		font-weight: 800;
		pointer-events: auto;
	}

	/* Persistent multiplier badge at the top of the screen */
	.mult-chip {
		position: absolute;
		top: calc(1.2rem + env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		padding: 0.35rem 1rem;
		border-radius: 999px;
		background: rgba(6, 10, 14, 0.65);
		font-size: 1.3rem;
		font-weight: 800;
		pointer-events: none;
	}

	/* Upgrade celebration: ×N pops in big and drifts up while fading out */
	.mult-pop {
		position: absolute;
		left: 50%;
		top: 26%;
		transform: translate(-50%, 0);
		font-size: 4.2rem;
		font-weight: 900;
		pointer-events: none;
		animation: mult-pop 1s ease-out forwards;
	}

	@keyframes mult-pop {
		0% { transform: translate(-50%, 0) scale(0.2) rotate(-8deg); opacity: 0; }
		25% { transform: translate(-50%, 0) scale(1.3) rotate(3deg); opacity: 1; }
		45% { transform: translate(-50%, 0) scale(1) rotate(0deg); opacity: 1; }
		100% { transform: translate(-50%, -46px) scale(0.9); opacity: 0; }
	}

	/* Blackout at the end of the dive: deepens to black and fades off the reward */
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
		background: #060b10; /* deep darkness around the gem */
	}

	.reward-view .gem {
		width: min(88vw, 380px);
		height: min(88vw, 380px);
		display: block;
	}

	.reward-view .cta {
		margin-top: 1.4rem;
		width: min(60vw, 240px);
		animation: rise 600ms 300ms ease-out both;
		pointer-events: none; /* the whole screen is already a button */
	}

	/* Streak celebration: loose vertical rhythm — hero, circle row and CTA breathe */
	.streak-view {
		gap: 2.4rem;
	}

	.streak-view .cta {
		margin-top: 0;
	}

	/* Streak hero count: a flame and a big number tell the streak at a glance */
	.streak-hero-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		animation: rise 600ms 150ms ease-out both;
	}

	.streak-hero {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.streak-count {
		font-size: 3.4rem;
		font-weight: 900;
		line-height: 1;
		color: var(--gold);
	}

	.streak-hero-label {
		margin: 0;
		color: var(--muted);
		font-weight: 600;
	}

	/* Streak row: completed days in gold, today's circle fills with a pop
	   plus a flame and a star burst — the rest wait empty.
	   The numbers under the circles show the streak days. */
	.streak-row {
		display: flex;
		gap: 0.55rem;
	}

	.streak-day {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
	}

	.streak-circle {
		position: relative;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--bg-high);
		display: grid;
		place-items: center;
	}

	.streak-circle.filled {
		background: var(--gold);
	}

	.streak-circle.today {
		animation: streak-fill 0.9s 0.5s ease both;
	}

	@keyframes streak-fill {
		0% { transform: scale(1) rotate(0deg); background: var(--bg-high); }
		35% { transform: scale(1.55) rotate(-6deg); background: var(--gold); }
		60% { transform: scale(0.9) rotate(4deg); background: var(--gold); }
		80% { transform: scale(1.12) rotate(-2deg); background: var(--gold); }
		100% { transform: scale(1) rotate(0deg); background: var(--gold); }
	}

	/* The flame pops into today's circle as the fill completes */
	.streak-flame {
		display: grid;
		place-items: center;
		animation: flame-pop 0.5s 1.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes flame-pop {
		from { transform: scale(0) rotate(-25deg); opacity: 0; }
		to { transform: scale(1) rotate(0deg); opacity: 1; }
	}

	.streak-num {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--muted);
	}

	.streak-num.reached {
		color: var(--gold);
	}

	/* Star burst: flecks shoot out of the circle at the moment of the fill and fade.
	   Celebration particles are game art, not UI chrome. */
	.confetti {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--s);
		height: var(--s);
		opacity: 0;
		pointer-events: none;
		animation: confetti-burst 0.95s var(--d) ease-out forwards;
	}

	.confetti.star {
		clip-path: polygon(
			50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
			50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
		);
	}

	@keyframes confetti-burst {
		0% { transform: translate(-50%, -50%) scale(0.3) rotate(0deg); opacity: 0; }
		12% { opacity: 1; }
		100% {
			transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1)
				rotate(var(--rot));
			opacity: 0;
		}
	}


	.reward {
		font-size: 2rem;
		font-weight: 800;
		color: var(--gold);
		margin: 0;
		animation: rise 600ms ease-out both;
	}

	@keyframes rise {
		from { opacity: 0; transform: translateY(14px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
