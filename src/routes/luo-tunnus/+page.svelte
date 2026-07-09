<script lang="ts">
	import { goto } from '$app/navigation';
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { session, refreshMe } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let email = $state('');
	let password = $state('');
	let passwordAgain = $state('');
	let displayName = $state('');
	let error = $state('');
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password !== passwordAgain) {
			error = 'Salasanat eivät täsmää.';
			return;
		}
		busy = true;
		try {
			await api.post('/api/auth/register', { email, password, displayName });
			await refreshMe();
			await goto('/asetukset');
		} catch (err) {
			error = err instanceof Error ? err.message : fi.errorMessage('SERVER_ERROR');
		}
		busy = false;
	}
</script>

<svelte:head><title>{fi.createAccount} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.createAccount} />

	{#if session.me?.kind === 'ghost'}
		<p class="muted">
			Haamutilisi edistyminen — {fi.lootsUnit(session.me.loots)} ja {session.me.coins} kolikkoa —
			siirtyy uudelle tunnuksellesi.
		</p>
	{/if}

	<form class="card" onsubmit={submit}>
		<label for="email">{fi.email}</label>
		<input id="email" type="email" bind:value={email} required autocomplete="email" />

		<label for="nimi">{fi.displayName}</label>
		<input id="nimi" bind:value={displayName} required minlength="3" maxlength="20" autocomplete="nickname" />
		<p class="muted small">{fi.displayNameHelp}</p>

		<label for="salasana">{fi.password}</label>
		<input id="salasana" type="password" bind:value={password} required minlength="10" autocomplete="new-password" />

		<label for="salasana2">{fi.passwordAgain}</label>
		<input id="salasana2" type="password" bind:value={passwordAgain} required autocomplete="new-password" />

		{#if error}<p class="error-text">{error}</p>{/if}

		<button class="btn btn-primary submit" type="submit" disabled={busy}>{fi.registerSubmit}</button>
	</form>

	<p class="muted center">
		<a href="/kirjaudu">{fi.login}</a>
	</p>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
	}

	.small { font-size: 0.85rem; margin: 0.3rem 0 0; }
	.submit { width: 100%; margin-top: 1.2rem; }
	.center { text-align: center; }
</style>
