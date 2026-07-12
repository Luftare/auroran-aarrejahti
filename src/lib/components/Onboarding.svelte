<script lang="ts">
	// One-time onboarding for new players, one spoonful at a time:
	// 1. landing view — a mock phone shows the game at a glance,
	// 2. Aurora's story, 3. how to play, 4. the location-permission ask.
	// The CTA lives in a static footer so its position never depends on the
	// step's content.
	import { fi } from '$lib/fi';
	import Flame from '@lucide/svelte/icons/flame';
	import Footprints from '@lucide/svelte/icons/footprints';
	import MapIcon from '@lucide/svelte/icons/map';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import MoonStar from '@lucide/svelte/icons/moon-star';

	let { oncomplete }: { oncomplete: () => void } = $props();

	const STEPS = 4;
	const LAST = STEPS - 1;
	let step = $state(0);

	const ctaLabel = $derived(
		[fi.onboardingStart, fi.onboardingStoryNext, fi.onboardingHowNext, fi.onboardingAllowLocation][
			step
		]
	);

	// The final CTA runs oncomplete inside the tap gesture, so the browser's
	// location-permission prompt opens immediately.
	function next() {
		if (step === LAST) oncomplete();
		else step += 1;
	}
</script>

<div class="overlay">
	<div class="body">
		{#key step}
			<section class="step">
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
								<span class="mock-hint">{fi.distanceToNearest(fi.formatDistance(200))}</span>
							</div>
						</div>
					</div>

					<p class="lead">{fi.onboardingLead}</p>
				{:else if step === 1}
					<!-- Night scene: the chest under a starry sky -->
					<div class="night" aria-hidden="true">
						<span class="moon"><MoonStar size={38} color="var(--gold)" /></span>
						<span class="nstar s1"></span>
						<span class="nstar s2"></span>
						<span class="nstar s3"></span>
						<img src="/arkku.png" alt="" width="84" height="84" />
					</div>
					<h2>{fi.onboardingStoryTitle}</h2>
					<p>{fi.onboardingStory1}</p>
					<p class="muted">{fi.onboardingStory2}</p>
				{:else if step === 2}
					<h2>{fi.onboardingHowTitle}</h2>
					<div class="how">
						<div class="how-row">
							<span class="how-icon"><MapIcon size={20} color="var(--aurora-teal)" /></span>
							{fi.onboardingHowMap}
						</div>
						<div class="how-row">
							<span class="how-icon"><Footprints size={20} color="var(--aurora-green)" /></span>
							{fi.onboardingHowWalk}
						</div>
						<div class="how-row">
							<span class="how-icon"><MoonStar size={20} color="var(--aurora-violet)" /></span>
							{fi.onboardingHowMidnight}
						</div>
					</div>
				{:else}
					<span class="pin"><MapPin size={34} color="var(--aurora-green)" /></span>
					<h2>{fi.onboardingLocationTitle}</h2>
					<p>{fi.onboardingLocationBody}</p>
				{/if}
			</section>
		{/key}
	</div>

	<!-- Static footer: the CTA and progress dots stay put across steps -->
	<div class="footer">
		<button
			class="btn cta"
			class:btn-primary={step < LAST}
			class:btn-gold={step === LAST}
			onclick={next}>{ctaLabel}</button
		>
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
		transform: rotate(-3deg);
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
		background: var(--aurora-teal);
		border: 2px solid #fff;
	}

	.mp-pulse {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: rgba(56, 195, 216, 0.4);
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

	.mock-hint {
		position: absolute;
		bottom: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: 88%;
		padding: 3px 9px;
		border-radius: 999px;
		background: var(--bg);
		font-size: 9px;
		font-weight: 600;
		text-align: center;
		color: var(--text);
	}

	/* ---- Story night scene ---- */

	.night {
		position: relative;
		width: 170px;
		height: 130px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.moon {
		position: absolute;
		top: 0;
		right: 10px;
		line-height: 0;
	}

	.nstar {
		position: absolute;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--text);
		animation: twinkle 2.6s ease-in-out infinite;
	}

	.nstar.s1 {
		left: 18px;
		top: 12px;
	}

	.nstar.s2 {
		left: 58px;
		top: 34px;
		animation-delay: 0.9s;
	}

	.nstar.s3 {
		right: 66px;
		top: 6px;
		animation-delay: 1.7s;
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

	/* ---- How to play ---- */

	.how {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 100%;
	}

	.how-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		background: var(--bg-raised);
		border-radius: var(--radius);
		padding: 0.75rem 0.9rem;
		text-align: left;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.how-icon {
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-high);
		display: flex;
		align-items: center;
		justify-content: center;
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
