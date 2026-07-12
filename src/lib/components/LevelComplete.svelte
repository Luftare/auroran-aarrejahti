<script lang="ts">
	// Level-complete celebration: shown as the last view after the level's
	// final chest of the day is collected. Celebrating Aurora on top, the
	// title, and the level list where the just-completed row winds up,
	// blossoms open and gets its tick with a confetti burst (LevelOptions).
	// When every level is done, congratulations plus the note that new
	// chests appear at midnight.
	import { fi } from '$lib/fi';
	import type { LevelId } from '$lib/game/chests';
	import type { LevelStatus } from '$lib/game/state.svelte';
	import LevelOptions from './LevelOptions.svelte';

	let {
		statuses,
		completedLevel,
		onpick,
		onclose
	}: {
		statuses: LevelStatus[];
		/** The level whose last chest was just collected — its row celebrates. */
		completedLevel: LevelId;
		/** Switches to another area and returns to the map. */
		onpick: (level: LevelId) => void;
		onclose: () => void;
	} = $props();

	const allDone = $derived(statuses.every((s) => !s.playable || s.complete));
	const completedMap = $derived(
		Object.fromEntries(statuses.map((s) => [s.level, s.complete])) as Partial<
			Record<LevelId, boolean>
		>
	);
</script>

<div class="overlay">
	<div class="content">
		<img class="aurora" src="/aurora-juhlii.webp" alt="" />
		<h2>{allDone ? fi.allLevelsDoneTitle : fi.levelCompleteTitle}</h2>
		{#if allDone}
			<p>{fi.allLevelsDoneBody}</p>
		{/if}
		<LevelOptions
			selected={completedLevel}
			celebrate={completedLevel}
			completed={completedMap}
			onselect={onpick}
		/>
	</div>

	<button class="btn btn-gold close" onclick={onclose}>{fi.backToMap}</button>
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

	.content {
		margin: auto;
		width: min(92vw, 420px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	/* Celebrating Aurora bounces in above the title */
	.aurora {
		width: min(44vw, 190px);
		height: auto;
		animation: aurora-jump 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes aurora-jump {
		from {
			transform: translateY(26px) scale(0.7);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 800;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 1rem;
	}

	.close {
		margin-top: 1.4rem;
		flex: none;
		width: min(60vw, 240px);
	}
</style>
