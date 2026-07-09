<script lang="ts">
	import { fi } from '$lib/fi';
	import { api } from '$lib/client/api';
	import { session, refreshMe, logout } from '$lib/client/session.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let displayName = $state('');
	let currentPassword = $state('');
	let newPassword = $state('');
	let nameMessage = $state('');
	let nameOk = $state(false);
	let pwMessage = $state('');
	let pwOk = $state(false);
	let busy = $state(false);

	$effect(() => {
		if (session.me && !displayName) displayName = session.me.displayName;
	});

	async function saveName() {
		busy = true;
		nameMessage = '';
		try {
			await api.patch('/api/me', { displayName });
			await refreshMe();
			nameMessage = fi.saved;
			nameOk = true;
		} catch (e) {
			nameMessage = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
			nameOk = false;
		}
		busy = false;
	}

	async function savePassword() {
		busy = true;
		pwMessage = '';
		try {
			await api.patch('/api/me', { currentPassword, newPassword });
			currentPassword = '';
			newPassword = '';
			pwMessage = fi.saved;
			pwOk = true;
		} catch (e) {
			pwMessage = e instanceof Error ? e.message : fi.errorMessage('SERVER_ERROR');
			pwOk = false;
		}
		busy = false;
	}
</script>

<svelte:head><title>{fi.settings} — {fi.appName}</title></svelte:head>

<main>
	<PageHeader title={fi.settings} />

	{#if session.me}
		<section class="card">
			<h2>{fi.account}</h2>

			{#if session.me.kind === 'ghost'}
				<p class="badge">👻 {fi.ghostBadge}: <strong>{session.me.displayName}</strong></p>
				<p class="muted">{fi.ghostReminder}</p>
				<a class="btn btn-primary" href="/luo-tunnus">{fi.createAccount}</a>
			{:else}
				<p class="muted">{session.me.email}</p>
				{#if !session.me.emailVerified}
					<p class="muted">{fi.verifyEmailSent}</p>
				{/if}

				<label for="nimimerkki">{fi.displayName}</label>
				<input id="nimimerkki" bind:value={displayName} maxlength="20" autocomplete="nickname" />
				<p class="muted small">{fi.displayNameHelp}</p>
				<button class="btn" disabled={busy} onclick={saveName}>{fi.saveChanges}</button>
				{#if nameMessage}<p class={nameOk ? 'ok-text' : 'error-text'}>{nameMessage}</p>{/if}

				<h3>{fi.changePassword}</h3>
				<label for="nykyinen">{fi.currentPassword}</label>
				<input id="nykyinen" type="password" bind:value={currentPassword} autocomplete="current-password" />
				<label for="uusi">{fi.newPassword}</label>
				<input id="uusi" type="password" bind:value={newPassword} autocomplete="new-password" />
				<button class="btn" disabled={busy || !currentPassword || !newPassword} onclick={savePassword}>
					{fi.changePassword}
				</button>
				{#if pwMessage}<p class={pwOk ? 'ok-text' : 'error-text'}>{pwMessage}</p>{/if}
			{/if}
		</section>

		<button class="btn" onclick={logout}>{fi.logout}</button>

		{#if session.me.isAdmin}
			<a class="btn" href="/yllapito">Ylläpito</a>
		{/if}
	{:else}
		<a class="btn btn-primary" href="/kirjaudu">{fi.login}</a>
	{/if}

	<section class="card">
		<h2>{fi.appInfo}</h2>
		<p class="muted small">
			{fi.appName} · <a href="https://github.com/ilmarikoskinen/auroran-aarrejahti">{fi.sourceCode}</a>
		</p>
		<p class="muted small">{fi.mapAttribution}</p>
	</section>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h2 { font-size: 1.05rem; }
	h3 { font-size: 1rem; margin-top: 1.4rem; }
	.small { font-size: 0.85rem; }
	.badge { margin: 0.2rem 0 0.6rem; }
	section .btn { margin-top: 0.8rem; }
</style>
