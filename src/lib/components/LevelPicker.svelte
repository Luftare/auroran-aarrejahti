<script lang="ts">
	// Area switcher, opened from the HUD's top-center level chip. The same
	// page as the onboarding's area step: a full-bleed preview map on top,
	// compact segmented tabs at the bottom, and a "Valitse <name>" CTA.
	// Toggling only moves the preview camera — the level is applied when
	// the CTA confirms it.
	import { fi } from '$lib/fi';
	import { LEVELS, SLOTS_BY_LEVEL, type LevelId } from '$lib/game/chests';
	import AreaPreviewMap from './AreaPreviewMap.svelte';
	import { LEVEL_ICONS } from './levelIcons';

	let {
		level,
		onselect,
		onclose
	}: {
		level: LevelId;
		onselect: (level: LevelId) => void;
		onclose: () => void;
	} = $props();

	// Deliberately captures only the initial value: the prop seeds the toggle
	// svelte-ignore state_referenced_locally
	let chosenLevel = $state<LevelId>(level);

	function confirm() {
		onselect(chosenLevel);
		onclose();
	}
</script>

<div class="overlay">
	<div class="area-map">
		<AreaPreviewMap level={chosenLevel} />
		<span class="area-title">{fi.chooseArea}</span>
	</div>

	<div class="area-tabs">
		{#each LEVELS as id (id)}
			{@const TabIcon = LEVEL_ICONS[id]}
			<button
				class="area-tab"
				class:active={id === chosenLevel}
				disabled={SLOTS_BY_LEVEL[id].length === 0}
				onclick={() => (chosenLevel = id)}
			>
				<TabIcon size={16} />
				{fi.levelName[id]}
			</button>
		{/each}
	</div>

	<div class="footer">
		<button class="btn btn-gold cta" onclick={confirm}>
			{fi.onboardingPickLevel(fi.levelName[chosenLevel])}
		</button>
		<button class="btn cta secondary" onclick={onclose}>{fi.close}</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		padding-top: calc(1rem + env(safe-area-inset-top));
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
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 1.05rem;
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

	.cta.secondary {
		font-size: 0.95rem;
		padding: 0.65rem 1.4rem;
		color: var(--muted);
	}
</style>
