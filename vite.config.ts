import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * Save endpoint for the chest-slot editor: the /editori page POSTs the
 * marked locations of one level (layer) here, and this writes them straight
 * into that level's SLOTS block of src/lib/game/chests.ts. Works only on
 * the dev server — in production the locations are hardcoded (MVP).
 */
const LEVEL_CONSTS: Record<string, string> = {
	puutarha: 'SLOTS_PUUTARHA',
	metsa: 'SLOTS_METSA',
	seutu: 'SLOTS_SEUTU'
};

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
						const { level, slots } = JSON.parse(body) as {
							level: string;
							slots: { lat: number; lng: number }[];
						};
						const constName = LEVEL_CONSTS[level];
						if (!constName) throw new Error('invalid level');
						if (
							!Array.isArray(slots) ||
							slots.some((s) => typeof s.lat !== 'number' || typeof s.lng !== 'number')
						) {
							throw new Error('invalid slots');
						}
						const entries = slots
							.map((s, i) => `\t{ id: '${level}-${i + 1}', lat: ${s.lat}, lng: ${s.lng} }`)
							.join(',\n');
						const block = `export const ${constName}: Slot[] = [\n${entries}\n];`;
						const file = resolve('src/lib/game/chests.ts');
						const source = readFileSync(file, 'utf8');
						const pattern = new RegExp(
							`export const ${constName}: Slot\\[\\] = \\[[\\s\\S]*?\\];`
						);
						if (!pattern.test(source)) throw new Error(`${constName} block not found`);
						writeFileSync(file, source.replace(pattern, block));
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
