<script lang="ts">
	// Debug-näkymä: kaikki jalokivet kerralla harvinaisuusjärjestyksessä
	// (yleisin ylhäällä vasemmalla, harvinaisin alhaalla oikealla).

	import { onDestroy, onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { createGemGallery, type GemGalleryRig } from './gems3d';

	let { onclose }: { onclose: () => void } = $props();

	let canvas: HTMLCanvasElement;
	let rig: GemGalleryRig | null = null;

	onMount(() => {
		rig = createGemGallery(canvas);
	});

	onDestroy(() => rig?.dispose());
</script>

<div class="overlay">
	<canvas bind:this={canvas}></canvas>
	<button class="btn close" onclick={onclose}>{fi.close}</button>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--bg);
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.close {
		position: absolute;
		left: 50%;
		bottom: calc(1.5rem + env(safe-area-inset-bottom));
		transform: translateX(-50%);
	}
</style>
