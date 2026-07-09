/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const SHELL_CACHE = `shell-${version}`;
const TILE_CACHE = 'tiles-v1';
const TILE_HOSTS = ['tiles.openfreemap.org'];
const TILE_LIMIT = 400;

const SHELL_ASSETS = [...build, ...files, '/'];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(SHELL_CACHE)
			.then((cache) => cache.addAll(SHELL_ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== SHELL_CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))
				)
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET') return;

	// Peli vaatii verkon — API-kutsuja ei koskaan tarjoilla välimuistista.
	if (url.origin === location.origin && url.pathname.startsWith('/api')) return;

	// Karttalaatat: välimuisti ensin, päivitys taustalla. Järvenperä on pieni,
	// joten pelialueen laatat pysyvät tarjolla myös katvealueilla.
	if (TILE_HOSTS.includes(url.hostname)) {
		event.respondWith(staleWhileRevalidate(event.request));
		return;
	}

	// Sovelluksen kuori: välimuistista, verkosta varalta; navigaatiot verkosta,
	// varalla välimuistin etusivu.
	if (url.origin === location.origin) {
		event.respondWith(
			caches.match(event.request).then(
				(cached) =>
					cached ??
					fetch(event.request).catch(() => {
						if (event.request.mode === 'navigate') {
							return caches.match('/') as Promise<Response>;
						}
						throw new Error('offline');
					})
			)
		);
	}
});

async function staleWhileRevalidate(request: Request): Promise<Response> {
	const cache = await caches.open(TILE_CACHE);
	const cached = await cache.match(request);
	const network = fetch(request)
		.then(async (response) => {
			if (response.ok) {
				await cache.put(request, response.clone());
				trimTileCache(cache);
			}
			return response;
		})
		.catch(() => cached);
	return cached ?? ((await network) as Response);
}

let trimming = false;
async function trimTileCache(cache: Cache): Promise<void> {
	if (trimming) return;
	trimming = true;
	try {
		const keys = await cache.keys();
		for (let i = 0; i < keys.length - TILE_LIMIT; i++) await cache.delete(keys[i]);
	} finally {
		trimming = false;
	}
}
