<script lang="ts">
	// Start-of-hunt modal: shown when the player enters the map after picking
	// an area. A centered card over a dimmed scrim — the map shows around the
	// edges, one step closer to the hunt. Running Aurora on top, the
	// nearest-treasure distance, and a gentle reminder to move carefully.
	import { fi } from '$lib/fi';

	let {
		dist,
		onclose
	}: {
		/** Distance to the nearest treasure, preformatted; null hides the line. */
		dist: string | null;
		onclose: () => void;
	} = $props();
</script>

<div class="scrim">
	<div class="card">
		<img class="aurora" src="/aurora-juoksee.webp" alt="" />
		<h2>{fi.startHuntTitle}</h2>
		<p>
			{#if dist}{fi.startHuntNearest(dist)}{/if}
			{fi.startHuntCareful}
		</p>
		<button class="btn btn-gold cta" onclick={onclose}>{fi.startHuntCta}</button>
	</div>
</div>

<style>
	/* Dimmed backdrop: the map stays visible around the card */
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 55;
		background: rgba(11, 29, 38, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.4rem;
		animation: scrim-in 220ms ease-out;
	}

	@keyframes scrim-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.card {
		width: min(86vw, 360px);
		background: var(--bg);
		border-radius: var(--radius);
		padding: 1.5rem 1.4rem 1.4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.9rem;
		text-align: center;
		animation: card-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes card-in {
		from {
			transform: scale(0.85) translateY(14px);
			opacity: 0;
		}
		to {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
	}

	/* Running Aurora dashes in from the side */
	.aurora {
		width: auto;
		height: min(24vh, 190px);
		animation: dash-in 0.55s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes dash-in {
		from {
			transform: translateX(-40px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	h2 {
		font-size: 1.4rem;
		font-weight: 800;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 1rem;
	}

	.cta {
		margin-top: 0.5rem;
		width: min(64vw, 260px);
		font-weight: 800;
		font-size: 1.05rem;
	}
</style>
