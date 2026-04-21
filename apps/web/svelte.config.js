import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // Force absolute asset/route paths. SvelteKit's `paths.relative` default
    // of `true` rewrites the shell's `<link href="../favicon.png">` and other
    // navigation hrefs relative to the current path. Combined with our deep
    // nested routes (e.g. /social/feed) and the `[[lang=lang]]` optional
    // segment, that produced stacked URLs like
    //   /social/feed/social/social/social/...
    // when clicking a navbar link from a deep page. We always serve from `/`
    // so absolute is both simpler and correct.
    paths: {
      relative: false,
    },
  },
};

export default config;
