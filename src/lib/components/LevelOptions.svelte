<script lang="ts">
	// The three areas as selectable rows: name and a short description.
	// The selected row is highlighted with fill (no borders — flat style).
	// Shared by the onboarding area step, the in-game level modal and the
	// level-complete view (which passes `completed` to show ticks).
	import { fi } from '$lib/fi';
	import { LEVELS, SLOTS_BY_LEVEL, type LevelId } from '$lib/game/chests';
	import Check from '@lucide/svelte/icons/check';
	import Flower2 from '@lucide/svelte/icons/flower-2';
	import Trees from '@lucide/svelte/icons/trees';
	import Mountain from '@lucide/svelte/icons/mountain';

	let {
		selected,
		completed,
		celebrate,
		onselect
	}: {
		selected: LevelId;
		/** Levels done for today: shown with a tick and not selectable. */
		completed?: Partial<Record<LevelId, boolean>>;
		/** The just-completed level plays the celebration: the row winds up
		 *  with a funny shrinking shake, blossoms back open, and gets its
		 *  tick with a confetti burst. */
		celebrate?: LevelId;
		onselect: (level: LevelId) => void;
	} = $props();

	const ICONS = { puutarha: Flower2, metsa: Trees, seutu: Mountain } as const;
	// All list icons share one color (same as the onboarding how-to icons)
	const ICON_COLOR = 'var(--aurora-green)';

	// Confetti burst around the celebrated row, timed to the blossom moment
	const CONFETTI_COLORS = [
		'var(--gold)',
		'var(--aurora-green)',
		'var(--aurora-teal)',
		'var(--aurora-violet)',
		'#ff9d2e'
	];
	const confetti = Array.from({ length: 20 }, (_, i) => {
		const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.4;
		return {
			dx: Math.cos(angle) * (110 + Math.random() * 90),
			dy: Math.sin(angle) * (48 + Math.random() * 42),
			rot: -180 + Math.random() * 360,
			size: 5 + Math.random() * 5,
			delay: 0.72 + Math.random() * 0.18,
			star: i % 2 === 0,
			color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
		};
	});
</script>

<div class="levels">
	{#each LEVELS as level (level)}
		{@const Icon = ICONS[level]}
		<button
			class="level-row"
			class:selected={level === selected}
			class:celebrate={level === celebrate}
			disabled={SLOTS_BY_LEVEL[level].length === 0 || completed?.[level]}
			onclick={() => onselect(level)}
		>
			<span class="level-icon"><Icon size={20} color={ICON_COLOR} /></span>
			<span class="level-text">
				<span class="level-name">{fi.levelName[level]}</span>
				<span class="level-desc">{fi.levelDesc[level]}</span>
			</span>
			{#if completed?.[level]}
				<span class="level-done"><Check size={18} color="var(--bg)" strokeWidth={3} /></span>
			{/if}
			{#if level === celebrate}
				{#each confetti as p, i (i)}
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
		position: relative;
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

	/* A layer without marks (or already completed today) cannot be picked */
	.level-row:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* Completed today: a gold tick at the row's end */
	.level-done {
		flex: none;
		margin-left: auto;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--gold);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* The just-completed row is the star of the show: full strength, and a
	   wind-up wiggle that shrinks before blossoming back with an overshoot */
	.level-row.celebrate:disabled {
		opacity: 1;
	}

	.level-row.celebrate {
		animation: row-celebrate 1.15s ease both;
	}

	@keyframes row-celebrate {
		0% { transform: scale(1) rotate(0deg); }
		14% { transform: scale(0.97) rotate(-2deg); }
		28% { transform: scale(0.92) rotate(2.5deg); }
		42% { transform: scale(0.87) rotate(-3deg); }
		54% { transform: scale(0.83) rotate(2deg); }
		62% { transform: scale(0.81) rotate(-1deg); }
		74% { transform: scale(1.14) rotate(1deg); }
		86% { transform: scale(0.96) rotate(-0.5deg); }
		100% { transform: scale(1) rotate(0deg); }
	}

	/* The tick pops in right as the row blossoms open */
	.level-row.celebrate .level-done {
		animation: tick-pop 0.45s 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes tick-pop {
		from {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
		to {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	/* Confetti bursts out around the row at the blossom moment.
	   Celebration particles are game art, not UI chrome. */
	.confetti {
		position: absolute;
		left: 50%;
		top: 50%;
		width: var(--s);
		height: var(--s);
		opacity: 0;
		pointer-events: none;
		animation: confetti-burst 1s var(--d) ease-out forwards;
	}

	.confetti.star {
		clip-path: polygon(
			50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
			50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
		);
	}

	@keyframes confetti-burst {
		0% {
			transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		100% {
			transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1)
				rotate(var(--rot));
			opacity: 0;
		}
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
