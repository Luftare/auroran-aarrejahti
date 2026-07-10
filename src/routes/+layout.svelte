<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { fi } from '$lib/fi';

	let { children } = $props();

	onMount(() => {
		if ('serviceWorker' in navigator && !import.meta.env.DEV) {
			navigator.serviceWorker.register('/service-worker.js');
		}
	});
</script>

<div class="rotate-overlay">{fi.rotatePortrait}</div>

{@render children()}
