# `kubb-plugin-svelte-query-patched`

Internal fork of [`@kubb/plugin-svelte-query`][upstream] **v4.37.5**
adding a single opt-in option: **`pathParamsAsGetters`**.

> Slated for upstream PR (tracked as `PD-025`). Keep edits minimal and
> reviewable — every diff against upstream should be defensible in a PR.

[upstream]: https://github.com/kubb-labs/kubb/tree/main/packages/plugin-svelte-query

---

## Why this fork exists

Svelte 5 raises a `state_referenced_locally` compile-time warning when a
`$state`/`$derived` value is captured into a closure that never
re-reads it. Kubb's generated query hooks read path-param arguments
exactly once when the hook is initialized, which trips the warning at
every call site:

```svelte
<script lang="ts">
  let { id } = $props();
  // ⚠ state_referenced_locally — kubb captures `id` once.
  const query = createGetV1JobsId(id);
</script>
```

The TanStack reactive way to fix this is to pass a getter:

```svelte
const query = createGetV1JobsId(() => id);
```

This fork lets kubb generate the signature `T | (() => T) | undefined`
so call sites can pass either form. Inside the hook body we unwrap the
getter once via `typeof v === 'function' ? v() : v` and pass plain
values to `queryOptions(...)` / `queryKey(...)`, so the rest of the
pipeline is untouched.

## Surface

```ts
pluginSvelteQuery({
  // ...
  pathParamsAsGetters: true, // default: false
});
```

Default is `false` — the option is **opt-in and backward-compatible**.
When `false`, generated output is byte-identical to upstream.

## Scope

- `Query` component (path-param signature + body prelude) — modified.
- `QueryOptions`, `QueryKey` — unchanged. They keep accepting plain
  values; the unwrap happens once in `Query` before calling them.
- `Mutation` — unchanged. Mutations receive path params via the
  `mutate(...)` payload at call time, not at hook init, so the
  warning doesn't apply.

## Updating from upstream

When bumping upstream kubb:

1. Diff `src/` against the new upstream tag.
2. Re-apply the two targeted patches (path-param type override + body
   unwrap prelude). Run `bun test` in this package (snapshot specs).
3. Re-run `bun run sdk:generate` in `packages/api-client` and verify no
   semantic diff on hooks without path params.

## Pending upstream work (PD-025)

Items to address before the upstream PR — deferred:

- Generator-level tests covering both option states.
- Changeset entry.
- README updates in upstream style.
- Extension to `@kubb/plugin-solid-query` / `@kubb/plugin-vue-query`
  (tracked as PD-026).
