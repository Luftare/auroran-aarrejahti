<script lang="ts">
	import { onMount } from 'svelte';
	import { api, ApiError } from '$lib/client/api';

	let dailyChestCount = $state(5);
	let lootRadiusM = $state(15);
	let message = $state('');
	let messageOk = $state(true);

	onMount(async () => {
		const data = await api.get<{ settings: { daily_chest_count: number; loot_radius_m: number } }>(
			'/api/admin/settings'
		);
		dailyChestCount = data.settings.daily_chest_count;
		lootRadiusM = data.settings.loot_radius_m;
	});

	async function save() {
		try {
			await api.patch('/api/admin/settings', {
				daily_chest_count: dailyChestCount,
				loot_radius_m: lootRadiusM
			});
			message = 'Tallennettu. Arkkumäärä vaikuttaa seuraavasta keskiyöstä alkaen.';
			messageOk = true;
		} catch (e) {
			message = e instanceof Error ? e.message : 'Tallennus epäonnistui.';
			messageOk = false;
		}
	}

	async function respawn() {
		try {
			await api.post('/api/admin/chests/respawn-today');
			message = 'Tämän päivän arkut arvottiin uudelleen.';
			messageOk = true;
		} catch (e) {
			message =
				e instanceof ApiError && e.status === 409
					? 'Joku on jo avannut arkun tänään — arkkuja ei voi enää arpoa uudelleen.'
					: 'Uudelleenarvonta epäonnistui.';
			messageOk = false;
		}
	}
</script>

<div class="card">
	<label for="maara">Arkkuja päivässä</label>
	<input id="maara" type="number" min="1" max="50" bind:value={dailyChestCount} />

	<label for="sade">Avausetäisyys (metriä)</label>
	<input id="sade" type="number" min="5" max="200" bind:value={lootRadiusM} />

	<button class="btn btn-primary save" onclick={save}>Tallenna</button>
</div>

<div class="card">
	<h2>Hätävara</h2>
	<p class="muted small">
		Arpoo tämän päivän arkut uudelleen. Onnistuu vain, jos kukaan ei ole vielä avannut arkkua tänään.
	</p>
	<button class="btn" onclick={respawn}>Arvo tämän päivän arkut uudelleen</button>
</div>

{#if message}<p class={messageOk ? 'ok-text' : 'error-text'}>{message}</p>{/if}

<style>
	.card { margin-bottom: 1rem; }
	.card h2 { font-size: 1.05rem; }
	.save { margin-top: 1.2rem; }
	.small { font-size: 0.88rem; }
	input[type='number'] { max-width: 10rem; }
</style>
