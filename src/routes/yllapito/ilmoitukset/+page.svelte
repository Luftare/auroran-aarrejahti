<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/client/api';

	type Report = {
		reportedId: string;
		displayName: string;
		reportCount: number;
		firstReportedAt: string;
	};

	let reports = $state<Report[]>([]);
	let message = $state('');

	async function load() {
		const data = await api.get<{ reports: Report[] }>('/api/admin/reports');
		reports = data.reports;
	}

	onMount(load);

	async function resolve(reportedId: string, action: 'dismiss' | 'reset_name') {
		const result = await api.post<{ displayName: string | null }>(
			`/api/admin/reports/${reportedId}/resolve`,
			{ action }
		);
		message =
			action === 'dismiss'
				? 'Ilmoitus hylätty — nimi on kunnossa.'
				: `Nimi vaihdettu: ${result.displayName}`;
		await load();
	}

	const dateFmt = new Intl.DateTimeFormat('fi-FI', { dateStyle: 'short' });
</script>

{#if message}<p class="ok-text">{message}</p>{/if}

{#if reports.length === 0}
	<p class="muted">Ei avoimia ilmoituksia. 🎉</p>
{:else}
	<div class="list">
		{#each reports as report (report.reportedId)}
			<div class="card row">
				<div class="info">
					<strong>{report.displayName}</strong>
					<span class="muted small">
						{report.reportCount} ilmoitus{report.reportCount > 1 ? 'ta' : ''} ·
						ensimmäinen {dateFmt.format(new Date(report.firstReportedAt))}
					</span>
				</div>
				<div class="actions">
					<button class="btn small-btn" onclick={() => resolve(report.reportedId, 'dismiss')}>
						Nimi on kunnossa
					</button>
					<button class="btn small-btn danger" onclick={() => resolve(report.reportedId, 'reset_name')}>
						Nollaa nimi
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.list { display: flex; flex-direction: column; gap: 0.5rem; }
	.row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap; }
	.info { display: flex; flex-direction: column; }
	.small { font-size: 0.85rem; }
	.actions { display: flex; gap: 0.5rem; }
	.small-btn { padding: 0.4rem 0.9rem; font-size: 0.88rem; }
	.danger { border-color: var(--danger); color: var(--danger); }
</style>
