<script lang="ts">
	// Area-switch modal: opened from the HUD's top-center level chip.
	// Picking an area applies it immediately and closes the modal.
	import { fi } from '$lib/fi';
	import type { LevelId } from '$lib/game/chests';
	import LevelOptions from './LevelOptions.svelte';

	let {
		level,
		onselect,
		onclose
	}: {
		level: LevelId;
		onselect: (level: LevelId) => void;
		onclose: () => void;
	} = $props();

	function pick(next: LevelId) {
		onselect(next);
		onclose();
	}
</script>

<div class="overlay">
	<p class="title">{fi.chooseArea}</p>

	<div class="options">
		<LevelOptions selected={level} onselect={pick} />
	</div>

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

	.options {
		width: min(92vw, 420px);
		margin-top: 0.4rem;
	}

	.close {
		margin-top: auto;
		width: min(60vw, 240px);
	}
</style>
