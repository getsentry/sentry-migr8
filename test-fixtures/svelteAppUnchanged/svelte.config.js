import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import { withSentryConfig } from '@sentry/svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({ postcss: true }),
    mdsvex({
      extensions: ['.md']
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

export default withSentryConfig(config);
