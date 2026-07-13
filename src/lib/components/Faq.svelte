<script lang="ts">
	// FAQ, opened from the front page's "Lue lisää" link. A scrollable list
	// of questions and answers; the "Selvä" CTA returns to the front page.
	import { fi } from '$lib/fi';

	let { onclose }: { onclose: () => void } = $props();
</script>

<div class="overlay">
	<div class="items">
		{#each fi.faq as item (item.q)}
			<section class="item">
				<h3>{item.q}</h3>
				{#each item.a as para, i (i)}
					<p>
						{#if typeof para === 'string'}
							{para}
						{:else}
							{#each para as seg, j (j)}
								{#if typeof seg === 'string'}{seg}{:else}<a
										href={seg.href}
										target="_blank"
										rel="noopener">{seg.label}</a
									>{/if}
							{/each}
						{/if}
					</p>
				{/each}
				{#if item.link}
					<p><a href={item.link.href} target="_blank" rel="noopener">{item.link.label}</a></p>
				{/if}
			</section>
		{/each}
	</div>

	<div class="footer">
		<button class="btn btn-gold cta" onclick={onclose}>{fi.faqClose}</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 70;
		background: var(--bg);
		display: flex;
		flex-direction: column;
	}

	.items {
		flex: 1;
		overflow-y: auto;
		width: 100%;
		padding: calc(1.4rem + env(safe-area-inset-top)) 1.6rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.item {
		max-width: 420px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h3 {
		font-size: 1.15rem;
		font-weight: 800;
		margin: 0;
	}

	p {
		margin: 0;
		font-size: 0.98rem;
		color: var(--muted);
	}

	.footer {
		flex: none;
		display: flex;
		justify-content: center;
		padding: 0.8rem 1.6rem calc(1.4rem + env(safe-area-inset-bottom));
	}

	.cta {
		width: min(78vw, 320px);
		font-weight: 700;
		font-size: 1.05rem;
	}
</style>
