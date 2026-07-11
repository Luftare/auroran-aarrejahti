import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * Save endpoint for the chest-slot editor: the /editori page POSTs the
 * marked locations here, and this writes them straight into the SLOTS
 * block of src/lib/game/chests.ts. Works only on the dev server — in
 * production the locations are hardcoded (MVP).
 */
function slotEditor(): Plugin {
	return {
		name: 'slot-editor',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__editori/slotit', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end();
					return;
				}
				let body = '';
				req.on('data', (chunk) => (body += chunk));
				req.on('end', () => {
					try {
						const { slots } = JSON.parse(body) as {
							slots: { lat: number; lng: number }[];
						};
						if (
							!Array.isArray(slots) ||
							slots.some((s) => typeof s.lat !== 'number' || typeof s.lng !== 'number')
						) {
							throw new Error('invalid slots');
						}
						const entries = slots
							.map((s, i) => `\t{ id: 'slotti-${i + 1}', lat: ${s.lat}, lng: ${s.lng} }`)
							.join(',\n');
						const block = `export const SLOTS: Slot[] = [\n${entries}\n];`;
						const file = resolve('src/lib/game/chests.ts');
						const source = readFileSync(file, 'utf8');
						const next = source.replace(
							/export const SLOTS: Slot\[\] = \[[\s\S]*?\];/,
							block
						);
						if (next === source && !source.includes(block)) {
							throw new Error('SLOTS block not found');
						}
						writeFileSync(file, next);
						res.setHeader('content-type', 'application/json');
						res.end(JSON.stringify({ ok: true, count: slots.length }));
					} catch (e) {
						res.statusCode = 400;
						res.setHeader('content-type', 'application/json');
						res.end(JSON.stringify({ ok: false, error: String(e) }));
					}
				});
			});
		}
	};
}

export default defineConfig({
	plugins: [sveltekit(), slotEditor()]
});
