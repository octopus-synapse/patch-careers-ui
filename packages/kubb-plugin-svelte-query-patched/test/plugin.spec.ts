import { describe, expect, test } from 'bun:test';
import { pluginSvelteQuery, pluginSvelteQueryName } from '../src/index.ts';

describe('pluginSvelteQuery (fork)', () => {
  test('exports the upstream plugin name verbatim — drop-in replacement', () => {
    expect(pluginSvelteQueryName).toBe('plugin-svelte-query');
  });

  test('pathParamsAsGetters defaults to false (upstream-compatible)', () => {
    const plugin = pluginSvelteQuery();
    expect(plugin.options.pathParamsAsGetters).toBe(false);
  });

  test('pathParamsAsGetters: true propagates to resolved options', () => {
    const plugin = pluginSvelteQuery({ pathParamsAsGetters: true });
    expect(plugin.options.pathParamsAsGetters).toBe(true);
  });

  test('pathParamsAsGetters: false explicit is preserved', () => {
    const plugin = pluginSvelteQuery({ pathParamsAsGetters: false });
    expect(plugin.options.pathParamsAsGetters).toBe(false);
  });

  test('other options pass through unchanged with new option set', () => {
    const plugin = pluginSvelteQuery({
      pathParamsAsGetters: true,
      paramsType: 'inline',
      pathParamsType: 'inline',
    });
    expect(plugin.options.paramsType).toBe('inline');
    expect(plugin.options.pathParamsType).toBe('inline');
    expect(plugin.options.pathParamsAsGetters).toBe(true);
  });

  test('plugin retains the upstream name string (so kubb pluginManager keys match)', () => {
    const plugin = pluginSvelteQuery();
    expect(plugin.name).toBe('plugin-svelte-query');
  });
});
