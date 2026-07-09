<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { fi } from '$lib/fi';
	import { ensureSession } from '$lib/client/session.svelte';

	let { children } = $props();

	onMount(() => {
		ensureSession();
		if ('serviceWorker' in navigator && !import.meta.env.DEV) {
			navigator.serviceWorker.register('/service-worker.js');
		}
	});
</script>

<div class="rotate-overlay">{fi.rotatePortrait}</div>

{@render children()}
