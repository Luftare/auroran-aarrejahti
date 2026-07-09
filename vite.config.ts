import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['@electric-sql/pglite']
	},
	ssr: {
		external: ['@node-rs/argon2', '@electric-sql/pglite', 'nodemailer', 'node-cron', 'postgres']
	}
});
