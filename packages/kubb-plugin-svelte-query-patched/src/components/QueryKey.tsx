// Fork delta: upstream uses `@internals/tanstack-query` (kubb monorepo
// internal). External consumers can't resolve that workspace alias, so
// we re-export the symbol from the published upstream `components`
// barrel — keeping the QueryKey impl identical to upstream.
export { QueryKey } from '@kubb/plugin-svelte-query/components';
