<script lang="ts">
	import { page } from '$app/state';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import PageHeader from '$lib/components/PageHeader.svelte';

	const token = page.url.searchParams.get('avain') ?? '';

	let newPassword = $state('');
	let passwordAgain = $state('');
	let error = $state('');
	let done = $state(false);
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (newPassword !== passwordAgain) {
			error = 'Salasanat eivät täsmää.';
			return;
		}
		busy = true;
		try {
			await api.post('/api/auth/reset', { token, newPassword });
			done = true;
		} catch (err) {
			error = err instanceof Error ? err.message : fi.errorMessage('SERVER_ERROR');
		}
		busy = false;
	}
</script>

<svelte:head><title>{fi.changePassword} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.changePassword} />

	{#if done}
		<p class="ok-text">{fi.resetDone}</p>
		<a class="btn btn-primary" href="/kirjaudu">{fi.login}</a>
	{:else if !token}
		<p class="error-text">{fi.errorMessage('TOKEN_INVALID')}</p>
	{:else}
		<form class="card" onsubmit={submit}>
			<label for="uusi">{fi.newPassword}</label>
			<input id="uusi" type="password" bind:value={newPassword} required minlength="10" autocomplete="new-password" />
			<label for="uusi2">{fi.passwordAgain}</label>
			<input id="uusi2" type="password" bind:value={passwordAgain} required autocomplete="new-password" />
			{#if error}<p class="error-text">{error}</p>{/if}
			<button class="btn btn-primary submit" type="submit" disabled={busy}>{fi.confirm}</button>
		</form>
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
	}

	.submit { width: 100%; margin-top: 1.2rem; }
</style>
