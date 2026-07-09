<script lang="ts">
	import { goto } from '$app/navigation';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { refreshMe } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);
	let forgotMode = $state(false);
	let forgotSent = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		busy = true;
		try {
			if (forgotMode) {
				await api.post('/api/auth/request-reset', { email });
				forgotSent = true;
			} else {
				await api.post('/api/auth/login', { email, password });
				await refreshMe();
				await goto('/');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : fi.errorMessage('SERVER_ERROR');
		}
		busy = false;
	}
</script>

<svelte:head><title>{fi.login} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={forgotMode ? fi.forgotPassword : fi.login} />

	{#if forgotSent}
		<p class="ok-text">{fi.resetRequested}</p>
		<a class="btn" href="/">{fi.backToMap}</a>
	{:else}
		<form class="card" onsubmit={submit}>
			<label for="email">{fi.email}</label>
			<input id="email" type="email" bind:value={email} required autocomplete="email" />

			{#if !forgotMode}
				<label for="salasana">{fi.password}</label>
				<input id="salasana" type="password" bind:value={password} required autocomplete="current-password" />
			{/if}

			{#if error}<p class="error-text">{error}</p>{/if}

			<button class="btn btn-primary submit" type="submit" disabled={busy}>
				{forgotMode ? fi.confirm : fi.loginSubmit}
			</button>
		</form>

		<p class="muted center">
			{#if forgotMode}
				<button class="linklike" onclick={() => (forgotMode = false)}>{fi.login}</button>
			{:else}
				<button class="linklike" onclick={() => (forgotMode = true)}>{fi.forgotPassword}</button>
				· <a href="/luo-tunnus">{fi.createAccount}</a>
			{/if}
		</p>
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
	}

	.submit { width: 100%; margin-top: 1.2rem; }
	.center { text-align: center; }
	.linklike { color: var(--aurora-teal); text-decoration: underline; padding: 0; }
</style>
