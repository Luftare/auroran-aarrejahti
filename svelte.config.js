import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Pelkkiä staattisia tiedostoja — peli elää kokonaan selaimessa.
		adapter: adapter()
	}
};

export default config;
