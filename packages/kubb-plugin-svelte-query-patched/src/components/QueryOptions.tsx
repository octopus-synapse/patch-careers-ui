// Fork delta: upstream `QueryOptions` is unchanged — re-exported from
// the published `@kubb/plugin-svelte-query`. The Query component handles
// the getter unwrap before calling QueryOptions with plain values, so
// this component never observes the new option.
export { QueryOptions } from '@kubb/plugin-svelte-query/components';
