<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { refreshMe } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let status = $state<'working' | 'ok' | 'error'>('working');
	let message = $state('');

	onMount(async () => {
		const token = page.url.searchParams.get('avain');
		if (!token) {
			status = 'error';
			message = fi.errorMessage('TOKEN_INVALID');
			return;
		}
		try {
			await api.post('/api/auth/verify', { token });
			await refreshMe().catch(() => {});
			status = 'ok';
		} catch (e) {
			status = 'error';
			message = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
		}
	});
</script>

<svelte:head><title>{fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.appName} />
	{#if status === 'working'}
		<p class="muted">…</p>
	{:else if status === 'ok'}
		<p class="ok-text">{fi.emailVerified}</p>
		<a class="btn btn-primary" href="/">{fi.backToMap}</a>
	{:else}
		<p class="error-text">{message}</p>
		<a class="btn" href="/">{fi.backToMap}</a>
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
	}
</style>
