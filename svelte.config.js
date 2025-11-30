import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Set base path for deployment
    // If BASE_PATH environment variable is set, use it; otherwise default to ''
    // For custom domains, leave empty (default). For GitHub Pages subdirectory, set to '/repository-name'
    paths: {
      base: process.env.BASE_PATH || ''
    },
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore 404 errors for favicon during prerender
        if (path === '/favicon.png' || path === '/favicon.ico') {
          return;
        }
        // Otherwise throw the error
        throw new Error(message);
      }
    }
  }
};

export default config;

