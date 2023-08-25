import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import * as Sentry from '@sentry/sveltekit';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({ postcss: true }),
    mdsvex({
      extensions: ['.md']
    }),
    Sentry.componentTrackingPreprocessor({
      trackComponents: ['Header', 'App', 'Footer'],
      trackInit: true,
      trackUpdates: false,
    }),
  ],

  extensions: ['.svelte', '.md'],

  kit: {
    adapter: adapter(),
    files: {
      lib: './src/lib'
    }
  },

  vitePlugin: {
    inspector: true
  }
};

export default config;
