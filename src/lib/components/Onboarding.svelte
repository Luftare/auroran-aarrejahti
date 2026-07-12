<script lang="ts">
	// One-time onboarding for new players, one spoonful at a time:
	// landing view (a mock phone shows the game at a glance), Aurora's story,
	// the area choice on a live preview map, the mandatory location-permission
	// ask, and the voluntary compass ask. The CTA lives in a static footer so
	// its position never depends on the step's content.
	import { fi } from '$lib/fi';
	import { geo } from '$lib/client/geo.svelte';
	import { compassSupported, requestCompass } from '$lib/client/compass.svelte';
	import { defaultLevel, LEVELS, SLOTS_BY_LEVEL, type LevelId } from '$lib/game/chests';
	import AreaPreviewMap from './AreaPreviewMap.svelte';
	import Compass from '@lucide/svelte/icons/compass';
	import Flame from '@lucide/svelte/icons/flame';
	import MapPin from '@lucide/svelte/icons/map-pin';

	let {
		onrequestlocation,
		onselectlevel,
		oncomplete
	}: {
		/** Starts (or restarts) location watching — triggers the permission prompt. */
		onrequestlocation: () => void;
		/** Applies the chosen area when the player confirms it. */
		onselectlevel: (level: LevelId) => void;
		oncomplete: () => void;
	} = $props();

	// Steps: landing, story, area (map preview), location (mandatory),
	// compass (voluntary)
	const STEPS = 5;
	const AREA_STEP = 2;
	const LOCATION_STEP = 3;
	const COMPASS_STEP = 4;
	let step = $state(0);

	// Area choice; the first playable level is preselected (layers without
	// marks cannot be toggled). Toggling only moves the preview camera —
	// the level is applied when the "Valitse <name>" CTA confirms it.
	let chosenLevel = $state<LevelId>(defaultLevel());

	// The location step waits for the permission result: the game cannot run
	// without it, so a failure only offers a retry. Once granted, the flow
	// moves on to the voluntary compass step (skipped without compass support).
	let locState = $state<'idle' | 'waiting' | 'failed' | 'done'>('idle');

	$effect(() => {
		if (locState !== 'waiting') return;
		if (geo.status === 'ok') {
			locState = 'done';
			if (compassSupported()) step = COMPASS_STEP;
			else oncomplete();
		} else if (geo.status === 'denied' || geo.status === 'unavailable') {
			locState = 'failed';
		}
	});

	const ctaLabel = $derived.by(() => {
		if (step === 0) return fi.onboardingStart;
		if (step === 1) return fi.chooseArea;
		if (step === AREA_STEP) return fi.onboardingPickLevel(fi.levelName[chosenLevel]);
		if (step === COMPASS_STEP) return fi.onboardingAllowCompass;
		if (locState === 'waiting') return fi.locating;
		if (locState === 'failed') return fi.retry;
		return fi.onboardingAllowLocation;
	});

	// The permission requests run inside the tap gesture, so the browser's
	// prompts open immediately.
	function next() {
		if (step === AREA_STEP) {
			onselectlevel(chosenLevel);
			step += 1;
			return;
		}
		if (step < LOCATION_STEP) {
			step += 1;
			return;
		}
		if (step === LOCATION_STEP) {
			if (locState === 'idle' || locState === 'failed') {
				locState = 'waiting';
				onrequestlocation();
			}
			return;
		}
		// Compass step: ask, then enter the map whatever the answer was
		void requestCompass().then(() => oncomplete());
	}

	// Starfield of the story's night scene: position (%), size (px) and
	// twinkle delay/duration (s). Hand-scattered so it renders the same
	// every time, sparser near the bottom where the chest sits.
	const NIGHT_STARS = [
		{ x: 4, y: 16, s: 3, d: 0.2, t: 2.6 },
		{ x: 11, y: 4, s: 4, d: 1.4, t: 3.0 },
		{ x: 19, y: 26, s: 2, d: 0.7, t: 2.3 },
		{ x: 27, y: 10, s: 3, d: 2.1, t: 2.8 },
		{ x: 35, y: 1, s: 2, d: 0.4, t: 3.2 },
		{ x: 43, y: 20, s: 4, d: 1.8, t: 2.5 },
		{ x: 52, y: 6, s: 3, d: 0.9, t: 2.9 },
		{ x: 60, y: 24, s: 2, d: 2.4, t: 2.4 },
		{ x: 68, y: 2, s: 4, d: 0.1, t: 3.1 },
		{ x: 76, y: 14, s: 3, d: 1.2, t: 2.7 },
		{ x: 85, y: 5, s: 2, d: 1.9, t: 2.4 },
		{ x: 93, y: 22, s: 3, d: 0.5, t: 3.3 },
		{ x: 8, y: 42, s: 2, d: 2.2, t: 2.6 },
		{ x: 24, y: 52, s: 3, d: 1.1, t: 3.0 },
		{ x: 48, y: 38, s: 2, d: 0.3, t: 2.5 },
		{ x: 72, y: 48, s: 2, d: 1.6, t: 2.8 },
		{ x: 90, y: 40, s: 3, d: 2.5, t: 2.4 },
		{ x: 16, y: 68, s: 2, d: 0.8, t: 3.1 },
		{ x: 82, y: 66, s: 2, d: 1.5, t: 2.7 }
	];
</script>

<div class="overlay">
	{#if step === 0}
		<!-- "Kehitetty Järvenperässä" stamp in the corner of the front page;
		     the image is the stamp's text, so the alt carries it -->
		<img class="stamp" src="/leima.webp" alt={fi.onboardingStamp} />
	{/if}

	<div class="body">
		{#key step}
			<section class="step" class:area={step === AREA_STEP}>
				{#if step === 0}
					<!-- Hero title: one word per line -->
					<h1>
						{#each fi.appName.split(' ') as word (word)}
							<span>{word}</span>
						{/each}
					</h1>

					<!-- Mock phone: a miniature "screenshot" of the game view — map,
					     treasure markers, player dot, HUD chips and the distance hint.
					     Aurora peeks from behind the phone's right edge: the base image
					     sits behind the phone (z-index -1) and a clipped copy of just
					     her fingers renders on top, so she grips the device.
					     Pure illustration; the flatness rule does not apply. -->
					<div class="phone-tilt" aria-hidden="true">
						<div class="phone">
							<img class="aurora aurora-peek" src="/aurora.webp" alt="" />
							<img class="aurora aurora-fingers" src="/aurora.webp" alt="" />
							<div class="screen">
								<span class="park p1"></span>
								<span class="park p2"></span>
								<span class="road r1"></span>
								<span class="road r2"></span>
								<span class="road r3"></span>
								<span class="mock-chest" style="left:26%;top:32%"
									><span class="face"><img src="/arkku.png" alt="" /></span></span
								>
								<span class="mock-chest" style="left:72%;top:44%"
									><span class="face"><img src="/arkku.png" alt="" /></span></span
								>
								<span class="mock-chest big" style="left:44%;top:64%"
									><span class="face"><img src="/arkku.png" alt="" /></span></span
								>
								<span class="mock-bubble" style="left:44%;top:64%"
									>{fi.chestDistance(fi.formatDistance(200))}</span
								>
								<span class="mock-player" style="left:60%;top:80%"
									><span class="mp-pulse"></span><span class="mp-core"></span></span
								>
								<span class="mock-notch"></span>
								<span class="mock-chip chip-left"
									><img src="/arkku.png" alt="" width="12" height="12" />12</span
								>
								<span class="mock-chip chip-right"
									><Flame size={11} color="var(--gold)" fill="var(--gold)" />4</span
								>
							</div>
						</div>
					</div>

					<p class="lead">{fi.onboardingLead}</p>
				{:else if step === 1}
					<!-- Night scene: the chest under a starry sky -->
					<div class="night" aria-hidden="true">
						{#each NIGHT_STARS as star, i (i)}
							<span
								class="nstar"
								style="left:{star.x}%;top:{star.y}%;width:{star.s}px;height:{star.s}px;animation-delay:{star.d}s;animation-duration:{star.t}s"
							></span>
						{/each}
						<img src="/arkku.png" alt="" width="84" height="84" />
					</div>
					<p>{fi.onboardingStory1}</p>
					<p class="muted">{fi.onboardingStory2}</p>
				{:else if step === AREA_STEP}
					<!-- Area choice: the map owns the top, a compact segmented
					     selector sits at the bottom. Toggling glides the camera
					     to the level's treasures. -->
					<div class="area-map">
						<AreaPreviewMap level={chosenLevel} />
						<span class="area-title">{fi.chooseArea}</span>
					</div>
					<div class="area-tabs">
						{#each LEVELS as id (id)}
							<button
								class="area-tab"
								class:active={id === chosenLevel}
								disabled={SLOTS_BY_LEVEL[id].length === 0}
								onclick={() => (chosenLevel = id)}
							>
								{fi.levelName[id]}
							</button>
						{/each}
					</div>
				{:else if step === LOCATION_STEP}
					<span class="pin"><MapPin size={34} color="var(--aurora-green)" /></span>
					<h2>{fi.onboardingLocationTitle}</h2>
					{#if locState === 'failed'}
						<p>{geo.status === 'denied' ? fi.locationDenied : fi.locationUnavailable}</p>
					{:else}
						<p>{fi.onboardingLocationBody}</p>
					{/if}
				{:else}
					<span class="pin"><Compass size={34} color="var(--aurora-green)" /></span>
					<h2>{fi.onboardingCompassTitle}</h2>
					<p>{fi.onboardingCompassBody}</p>
				{/if}
			</section>
		{/key}
	</div>

	<!-- Static footer: the CTA and progress dots stay put across steps -->
	<div class="footer">
		<button
			class="btn cta"
			class:btn-primary={step < LOCATION_STEP}
			class:btn-gold={step >= LOCATION_STEP}
			disabled={step === LOCATION_STEP && locState === 'waiting'}
			onclick={next}>{ctaLabel}</button
		>
		{#if step === COMPASS_STEP}
			<!-- The compass is voluntary: a gray secondary way past it -->
			<button class="btn cta secondary" onclick={oncomplete}>{fi.onboardingSkipCompass}</button>
		{/if}
		<div class="dots" aria-hidden="true">
			{#each Array(STEPS) as _, i (i)}
				<span class="dot" class:active={i === step}></span>
			{/each}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		padding-top: calc(1rem + env(safe-area-inset-top));
	}

	/* The stamp slams into the top-left corner of the front page */
	.stamp {
		position: absolute;
		top: calc(0.6rem + env(safe-area-inset-top));
		left: 0.8rem;
		width: 96px;
		height: auto;
		z-index: 1;
		pointer-events: none;
		animation: stamp-in 0.4s 0.2s ease-out both;
	}

	@keyframes stamp-in {
		from {
			transform: rotate(-12deg) scale(1.9);
			opacity: 0;
		}
		70% {
			transform: rotate(-12deg) scale(0.93);
			opacity: 1;
		}
		to {
			transform: rotate(-12deg) scale(1);
			opacity: 1;
		}
	}

	/* The step content scrolls if it must; the footer below never moves */
	.body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* One spoonful per screen: the step is centered and slides gently in */
	.step {
		margin: auto;
		width: 100%;
		max-width: 420px;
		padding: 1rem 1.6rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		text-align: center;
		animation: step-in 0.35s ease;
	}

	@keyframes step-in {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	h1 {
		font-size: 3rem;
		font-weight: 800;
		line-height: 1.08;
		margin: 0;
	}

	h1 span {
		display: block;
	}

	h2 {
		font-size: 1.35rem;
		font-weight: 800;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 1rem;
	}

	.lead {
		font-size: 1.05rem;
		font-weight: 600;
	}

	.footer {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		padding: 0.6rem 1.6rem calc(1.4rem + env(safe-area-inset-bottom));
	}

	.cta {
		width: min(78vw, 320px);
		font-weight: 700;
		font-size: 1.05rem;
	}

	/* Secondary action: the plain gray button under the primary CTA */
	.cta.secondary {
		font-size: 0.95rem;
		padding: 0.65rem 1.4rem;
		color: var(--muted);
	}

	.dots {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--bg-high);
		transition: background 0.2s ease;
	}

	.dot.active {
		background: var(--aurora-green);
	}

	/* ---- Mock phone (landing) ---- */

	/* The rotation lives on this wrapper, not on .phone: a transform on
	   .phone would create a stacking context and pull Aurora's z-index -1
	   base image in front of the bezel. Shifted slightly left so peeking
	   Aurora fits on narrow screens. */
	.phone-tilt {
		transform: rotate(-7deg);
		flex: none;
		margin-right: 2.5rem;
	}

	/* The bezel is the frame; the screen shows a stylized game view */
	.phone {
		position: relative;
		width: min(50vw, 190px);
		aspect-ratio: 9 / 18.5;
		background: var(--bg-high);
		border-radius: 30px;
		padding: 7px;
	}

	/* Short screens: shrink the hero so the whole spoonful fits without
	   scrolling. Must come after the base rules — same specificity, and a
	   media query adds none, so source order decides. */
	@media (max-height: 640px) {
		h1 {
			font-size: 2.3rem;
		}

		.phone {
			width: min(38vw, 122px);
		}

		.stamp {
			width: 70px;
		}
	}

	/* Aurora behind the phone: the grip line in the image (10.99% from its
	   left edge) aligns with the phone's right edge — right offset is
	   width × (1 − 0.1099). The image is 512×909. */
	.aurora {
		position: absolute;
		width: 66%;
		height: auto;
		top: 3%;
		right: -58.8%;
	}

	/* The base image hides behind the phone's bezel */
	.aurora-peek {
		z-index: -1;
	}

	/* Only her fingers (left of the grip line) render in front of the phone */
	.aurora-fingers {
		z-index: 1;
		clip-path: inset(46% 88.5% 34% 0);
	}

	.screen {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 24px;
		overflow: hidden;
		background: #efece2; /* light map base, like the game's map tiles */
	}

	.park {
		position: absolute;
		border-radius: 40%;
		background: #d7e8c0;
	}

	.park.p1 {
		width: 55%;
		height: 26%;
		left: -12%;
		top: 8%;
	}

	.park.p2 {
		width: 48%;
		height: 22%;
		right: -10%;
		bottom: 16%;
	}

	.road {
		position: absolute;
		background: #fff;
	}

	.road.r1 {
		left: -20%;
		top: 38%;
		width: 140%;
		height: 11px;
		transform: rotate(-16deg);
	}

	.road.r2 {
		left: 30%;
		top: -10%;
		width: 9px;
		height: 120%;
		transform: rotate(14deg);
	}

	.road.r3 {
		left: -20%;
		top: 66%;
		width: 140%;
		height: 7px;
		transform: rotate(8deg);
	}

	/* Miniature chest markers, in the game's marker style: dark ring, gold face */
	.mock-chest {
		position: absolute;
		transform: translate(-50%, -50%);
		padding: 2px;
		background: var(--bg-high);
		border-radius: 50%;
		display: block;
		line-height: 0;
	}

	.mock-chest .face {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--gold);
	}

	.mock-chest .face img {
		width: 19px;
		height: 19px;
	}

	.mock-chest.big .face {
		width: 34px;
		height: 34px;
		animation: mock-wiggle 2.4s ease-in-out infinite;
	}

	.mock-chest.big .face img {
		width: 25px;
		height: 25px;
	}

	@keyframes mock-wiggle {
		0%,
		60% {
			transform: rotate(0deg);
		}
		66% {
			transform: rotate(-7deg);
		}
		72% {
			transform: rotate(6deg);
		}
		78% {
			transform: rotate(-4deg);
		}
		84%,
		100% {
			transform: rotate(0deg);
		}
	}

	.mock-player {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
	}

	.mp-core {
		position: absolute;
		inset: 3px;
		border-radius: 50%;
		background: var(--bg-high);
		border: 2px solid #fff;
	}

	.mp-pulse {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(31, 68, 84, 0.45);
		animation: mock-pulse 2s ease-out infinite;
	}

	@keyframes mock-pulse {
		0% {
			transform: scale(0.6);
			opacity: 0.9;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	.mock-notch {
		position: absolute;
		top: 7px;
		left: 50%;
		transform: translateX(-50%);
		width: 34%;
		height: 10px;
		border-radius: 999px;
		background: var(--bg-high);
	}

	/* Miniature HUD chips and the distance hint, like in the real game view */
	.mock-chip {
		position: absolute;
		top: 24px;
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 7px;
		border-radius: 999px;
		background: var(--bg);
		font-size: 10px;
		font-weight: 700;
		color: var(--text);
		line-height: 1.2;
	}

	.mock-chip img {
		display: block;
	}

	.chip-left {
		left: 8px;
	}

	.chip-right {
		right: 8px;
	}

	/* Mini speech bubble above the big chest, like tapping a treasure in-game */
	.mock-bubble {
		position: absolute;
		transform: translate(-50%, -190%);
		width: max-content;
		padding: 3px 9px;
		border-radius: 999px;
		background: var(--bg);
		font-size: 9px;
		font-weight: 700;
		color: var(--text);
	}

	.mock-bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -5px;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: var(--bg);
		border-bottom: none;
	}

	/* ---- Story night scene ---- */

	.night {
		position: relative;
		width: min(70vw, 240px);
		height: 140px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.nstar {
		position: absolute;
		border-radius: 50%;
		background: var(--text);
		animation: twinkle ease-in-out infinite;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.25;
		}
		50% {
			opacity: 0.9;
		}
	}

	/* ---- Area choice: a full-bleed map step, unlike the other spoonfuls ---- */

	.step.area {
		max-width: none;
		margin: 0;
		padding: 0;
		flex: 1;
		align-self: stretch;
		gap: 0;
		text-align: initial;
	}

	.area-map {
		position: relative;
		flex: 1;
		width: 100%;
	}

	/* Title floats over the map like the game's HUD chips */
	.area-title {
		position: absolute;
		top: 0.7rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 5;
		padding: 0.5rem 1.1rem;
		border-radius: 999px;
		background: var(--bg);
		font-weight: 800;
		font-size: 1.05rem;
		pointer-events: none;
	}

	/* Compact segmented selector: three pills, the active one filled */
	.area-tabs {
		flex: none;
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.9rem 1rem 0.1rem;
	}

	.area-tab {
		padding: 0.5rem 1.15rem;
		border-radius: 999px;
		background: var(--bg-raised);
		color: var(--muted);
		font-weight: 700;
		font-size: 0.98rem;
		transition: background 150ms ease, color 150ms ease;
	}

	.area-tab.active {
		background: var(--aurora-green);
		color: #06222b;
	}

	.area-tab:disabled {
		opacity: 0.4;
	}

	/* ---- Location step ---- */

	.pin {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--bg-raised);
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
