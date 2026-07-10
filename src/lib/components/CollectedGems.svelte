<script lang="ts">
	// Kerättyjen jalokivien kokoelma: pelaajan omistamat kivet
	// harvinaisuusjärjestyksessä, lukumäärä merkittynä kun niitä on useampia.

	import { fi } from '$lib/fi';
	import { createGemView, GEM_ORDER, type GemKind } from './gems3d';

	let {
		gems,
		onclose
	}: {
		gems: Partial<Record<GemKind, number>>;
		onclose: () => void;
	} = $props();

	const owned = $derived(GEM_ORDER.filter((kind) => (gems[kind] ?? 0) > 0));

	/** Svelte-action: elää canvasin mukana — rig syntyy ja tuhoutuu siistiksi. */
	function gemview(canvas: HTMLCanvasElement, kind: GemKind) {
		const rig = createGemView(canvas, kind);
		return { destroy: () => rig.dispose() };
	}
</script>

<div class="overlay">
	<p class="title">{fi.gemsTitle}</p>

	{#if owned.length === 0}
		<p class="empty">{fi.noGems}</p>
	{:else}
		<div class="grid">
			{#each owned as kind (kind)}
				<div class="cell">
					<canvas use:gemview={kind}></canvas>
					{#if (gems[kind] ?? 0) > 1}
						<span class="count">×{gems[kind]}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<button class="btn close" onclick={onclose}>{fi.close}</button>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: calc(1.2rem + env(safe-area-inset-top)) 1rem calc(1.5rem + env(safe-area-inset-bottom));
		overflow-y: auto;
	}

	.title {
		font-size: 1.25rem;
		font-weight: 800;
		margin: 0 0 0.6rem;
	}

	.empty {
		margin: auto;
		color: var(--muted);
		font-weight: 600;
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
		width: min(92vw, 420px);
	}

	.cell {
		position: relative;
	}

	.cell canvas {
		width: 100%;
		aspect-ratio: 1;
		display: block;
	}

	.count {
		position: absolute;
		right: 12%;
		bottom: 10%;
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: var(--bg-high);
		color: var(--gold);
		font-weight: 800;
		font-size: 0.95rem;
	}

	.close {
		margin-top: auto;
		width: min(60vw, 240px);
	}
</style>
