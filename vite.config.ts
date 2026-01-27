import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['clawdbot-vnic.tail5b53bc.ts.net', '127.0.0.1', '0.0.0.0']
	},
	preview: {
		allowedHosts: ['clawdbot-vnic.tail5b53bc.ts.net', '127.0.0.1', '0.0.0.0']
	}
});
