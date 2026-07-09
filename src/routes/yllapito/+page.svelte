<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { api } from '$lib/client/api';

	type Point = {
		id: string;
		name: string;
		lat: number;
		lng: number;
		active: boolean;
		notes: string | null;
		todayCoinCount: number | null;
	};

	let points = $state<Point[]>([]);
	let selected = $state<Point | null>(null);
	let isNew = $state(false);
	let message = $state('');
	let container: HTMLDivElement;
	let map: maplibregl.Map | null = null;
	let markers = new Map<string, maplibregl.Marker>();
	let draftMarker: maplibregl.Marker | null = null;

	async function load() {
		const data = await api.get<{ points: Point[] }>('/api/admin/spawn-points');
		points = data.points;
	}

	onMount(async () => {
		await load();
		map = new maplibregl.Map({
			container,
			style: 'https://tiles.openfreemap.org/styles/liberty',
			center: points.length ? [points[0].lng, points[0].lat] : [24.65, 60.278],
			zoom: 13,
			attributionControl: { compact: true }
		});
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
		// Napautus kartalle aloittaa uuden kätköpaikan
		map.on('click', (e) => {
			if (selected) return;
			startNew(e.lngLat.lat, e.lngLat.lng);
		});
	});

	onDestroy(() => map?.remove());

	$effect(() => {
		if (!map) return;
		const wanted = new Set(points.map((p) => p.id));
		for (const [id, m] of markers) {
			if (!wanted.has(id)) {
				m.remove();
				markers.delete(id);
			}
		}
		for (const p of points) {
			const existing = markers.get(p.id);
			if (existing) {
				existing.setLngLat([p.lng, p.lat]);
				(existing.getElement().firstChild as HTMLElement).className =
					`pin ${p.active ? 'pin-active' : 'pin-inactive'}${p.todayCoinCount != null ? ' pin-today' : ''}`;
				continue;
			}
			const el = document.createElement('div');
			el.innerHTML = `<div class="pin ${p.active ? 'pin-active' : 'pin-inactive'}${p.todayCoinCount != null ? ' pin-today' : ''}"></div>`;
			el.addEventListener('click', (ev) => {
				ev.stopPropagation();
				selected = { ...p };
				isNew = false;
			});
			const marker = new maplibregl.Marker({ element: el, draggable: true })
				.setLngLat([p.lng, p.lat])
				.addTo(map!);
			marker.on('dragend', async () => {
				const pos = marker.getLngLat();
				await api.patch(`/api/admin/spawn-points/${p.id}`, { lat: pos.lat, lng: pos.lng });
				await load();
			});
			markers.set(p.id, marker);
		}
	});

	function startNew(lat: number, lng: number) {
		selected = { id: '', name: '', lat, lng, active: true, notes: null, todayCoinCount: null };
		isNew = true;
		draftMarker?.remove();
		const el = document.createElement('div');
		el.innerHTML = '<div class="pin pin-draft"></div>';
		draftMarker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map!);
	}

	function useMyLocation() {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				startNew(pos.coords.latitude, pos.coords.longitude);
				map?.easeTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 });
			},
			() => (message = 'Sijaintia ei saatu.')
		);
	}

	function closeForm() {
		selected = null;
		isNew = false;
		draftMarker?.remove();
		draftMarker = null;
	}

	async function save() {
		if (!selected) return;
		message = '';
		try {
			if (isNew) {
				await api.post('/api/admin/spawn-points', {
					name: selected.name,
					lat: selected.lat,
					lng: selected.lng,
					active: selected.active,
					notes: selected.notes || null
				});
			} else {
				await api.patch(`/api/admin/spawn-points/${selected.id}`, {
					name: selected.name,
					active: selected.active,
					notes: selected.notes || null
				});
			}
			closeForm();
			await load();
		} catch (e) {
			message = e instanceof Error ? e.message : 'Tallennus epäonnistui.';
		}
	}

	async function removePoint() {
		if (!selected || isNew) return;
		const result = await api.del<{ deleted?: boolean; deactivated?: boolean }>(
			`/api/admin/spawn-points/${selected.id}`
		);
		message = result.deactivated
			? 'Paikkaa on jo käytetty, joten se poistettiin käytöstä poistamisen sijaan.'
			: 'Kätköpaikka poistettu.';
		closeForm();
		await load();
	}
</script>

<p class="muted hint">
	Napauta karttaa lisätäksesi kätköpaikan, raahaa merkkiä siirtääksesi sitä. Vihreä = käytössä,
	harmaa = pois käytöstä, kultareunus = tämän päivän arkku. Valitse paikkoja, joihin on turvallinen
	ja luvallinen kävellä.
</p>

<div class="map" bind:this={container}></div>

<button class="btn" onclick={useMyLocation}>📍 Lisää nykyiseen sijaintiini</button>
{#if message}<p class="ok-text">{message}</p>{/if}

{#if selected}
	<div class="card form">
		<h2>{isNew ? 'Uusi kätköpaikka' : 'Muokkaa kätköpaikkaa'}</h2>
		<label for="nimi">Nimi</label>
		<input id="nimi" bind:value={selected.name} placeholder="esim. Lammen laituri" />
		<label for="muistiinpanot">Muistiinpanot</label>
		<input id="muistiinpanot" bind:value={selected.notes} placeholder="kulkuohjeet, huomiot" />
		<label class="check">
			<input type="checkbox" bind:checked={selected.active} /> Käytössä
		</label>
		<p class="muted small">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
		<div class="actions">
			<button class="btn btn-primary" onclick={save} disabled={!selected.name.trim()}>Tallenna</button>
			{#if !isNew}<button class="btn danger" onclick={removePoint}>Poista</button>{/if}
			<button class="btn" onclick={closeForm}>Peruuta</button>
		</div>
	</div>
{/if}

<style>
	.hint { font-size: 0.88rem; }

	.map {
		width: 100%;
		height: min(60vh, 480px);
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--border);
		margin-bottom: 0.8rem;
	}

	.form { margin-top: 1rem; }
	.form h2 { font-size: 1.05rem; }
	.check { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.9rem; color: var(--text); }
	.check input { width: auto; }
	.small { font-size: 0.85rem; }
	.actions { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
	.danger { border-color: var(--danger); color: var(--danger); }

	:global(.pin) {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid #fff;
		box-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
	}

	:global(.pin-active) { background: var(--aurora-green); }
	:global(.pin-inactive) { background: #6b7d84; }
	:global(.pin-today) { outline: 3px solid var(--gold); }
	:global(.pin-draft) { background: var(--aurora-violet); }
</style>
