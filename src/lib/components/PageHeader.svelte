<script lang="ts">
	let { title }: { title: string } = $props();
</script>

<header>
	<a href="/" aria-label="Takaisin">←</a>
	<h1>{title}</h1>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 0.4rem 0 0.8rem;
	}

	a {
		font-size: 1.5rem;
		text-decoration: none;
		color: var(--text);
		line-height: 1;
	}

	h1 {
		font-size: 1.3rem;
		margin: 0;
	}
</style>
