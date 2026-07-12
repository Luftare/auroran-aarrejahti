<script lang="ts">
	// The three areas as selectable rows: name and a short description.
	// The selected row is highlighted with fill (no borders — flat style).
	// Shared by the onboarding area step and the in-game level modal.
	import { fi } from '$lib/fi';
	import { LEVELS, SLOTS_BY_LEVEL, type LevelId } from '$lib/game/chests';
	import Flower2 from '@lucide/svelte/icons/flower-2';
	import Trees from '@lucide/svelte/icons/trees';
	import Mountain from '@lucide/svelte/icons/mountain';

	let {
		selected,
		onselect
	}: {
		selected: LevelId;
		onselect: (level: LevelId) => void;
	} = $props();

	const ICONS = { puutarha: Flower2, metsa: Trees, seutu: Mountain } as const;
	const COLORS = {
		puutarha: 'var(--aurora-green)',
		metsa: 'var(--aurora-teal)',
		seutu: 'var(--aurora-violet)'
	} as const;
</script>

<div class="levels">
	{#each LEVELS as level (level)}
		{@const Icon = ICONS[level]}
		<button
			class="level-row"
			class:selected={level === selected}
			disabled={SLOTS_BY_LEVEL[level].length === 0}
			onclick={() => onselect(level)}
		>
			<span class="level-icon"><Icon size={20} color={COLORS[level]} /></span>
			<span class="level-text">
				<span class="level-name">{fi.levelName[level]}</span>
				<span class="level-desc">{fi.levelDesc[level]}</span>
			</span>
		</button>
	{/each}
</div>

<style>
	.levels {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 100%;
	}

	.level-row {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		background: var(--bg-raised);
		border-radius: var(--radius);
		padding: 0.75rem 0.9rem;
		text-align: left;
		color: var(--text);
		transition: background 150ms ease;
	}

	/* Selection is shown with fill, per the flat style */
	.level-row.selected {
		background: var(--bg-high);
	}

	/* A layer without marks cannot be played yet */
	.level-row:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.level-icon {
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-high);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.level-row.selected .level-icon {
		background: var(--bg-card);
	}

	.level-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.level-name {
		font-weight: 800;
		font-size: 1.02rem;
	}

	.level-desc {
		font-size: 0.88rem;
		color: var(--muted);
		font-weight: 600;
	}
</style>
