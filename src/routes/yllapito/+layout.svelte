<script lang="ts">
	import { page } from '$app/state';
	import { session } from '$lib/client/session.svelte';

	let { children } = $props();

	const tabs = [
		{ href: '/yllapito', label: 'Kätköpaikat' },
		{ href: '/yllapito/pelaajat', label: 'Pelaajat' },
		{ href: '/yllapito/ilmoitukset', label: 'Ilmoitukset' },
		{ href: '/yllapito/asetukset', label: 'Asetukset' }
	];
</script>

{#if !session.ready}
	<p class="muted center">…</p>
{:else if !session.me?.isAdmin}
	<!-- Ylläpidon olemassaoloa ei paljasteta muille -->
	<main class="center">
		<h1>Sivua ei löytynyt</h1>
		<a href="/">Takaisin peliin</a>
	</main>
{:else}
	<main>
		<header>
			<a href="/" aria-label="Takaisin peliin">←</a>
			<h1>Ylläpito</h1>
		</header>
		<nav>
			{#each tabs as tab}
				<a class="tab" class:active={page.url.pathname === tab.href} href={tab.href}>{tab.label}</a>
			{/each}
		</nav>
		{@render children()}
	</main>
{/if}

<style>
	main {
		max-width: 760px;
		margin: 0 auto;
		padding: 0.6rem 1rem 2rem;
	}

	.center { text-align: center; padding-top: 4rem; }

	header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding-bottom: 0.6rem;
	}

	header a { font-size: 1.5rem; text-decoration: none; color: var(--text); }
	h1 { font-size: 1.3rem; margin: 0; }

	nav {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.tab {
		padding: 0.45rem 0.9rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--bg-raised);
		color: var(--muted);
		font-weight: 600;
		text-decoration: none;
		font-size: 0.92rem;
	}

	.tab.active {
		background: var(--bg-card);
		color: var(--text);
		border-color: var(--aurora-teal);
	}
</style>
