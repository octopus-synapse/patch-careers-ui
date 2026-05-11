import * as path from 'node:path';
import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginTs } from '@kubb/plugin-ts';
import { pluginZod } from '@kubb/plugin-zod';
// PD-010 / F5-12 C3: consume the patched fork to get the
// `pathParamsAsGetters` option. Drop-in replacement for the upstream
// import — same plugin name (`plugin-svelte-query`), same option shape
// plus one new opt-in field.
import { pluginSvelteQuery } from 'kubb-plugin-svelte-query-patched';

const BACKEND_URL = process.env.BACKEND_URL;
const localSwaggerPath = path.resolve(__dirname, '../../../profile-services/client-swagger.json');
const inputSource = BACKEND_URL ? `${BACKEND_URL}/api/client-swagger-json` : localSwaggerPath;

export default defineConfig({
  root: '.',
  input: { path: inputSource },
  output: {
    path: './src/generated',
    clean: true,
    extension: { '.ts': '' },
  },
  plugins: [
    pluginOas({ validate: false }),
    pluginTs({
      output: { path: './models' },
      group: { type: 'tag', name: ({ group }) => `${group}Controller` },
      enumType: 'asConst',
    }),
    pluginZod({
      output: { path: './zod' },
      group: { type: 'tag', name: ({ group }) => `${group}Controller` },
      typed: true,
    }),
    pluginClient({
      output: { path: './clients' },
      group: { type: 'tag', name: ({ group }) => `${group}Controller` },
      importPath: '../../../client/fetcher',
      dataReturnType: 'data',
    }),
    pluginSvelteQuery({
      output: { path: './hooks' },
      group: { type: 'tag', name: ({ group }) => `${group}Controller` },
      client: { importPath: '../../../client/fetcher', dataReturnType: 'data' },
      // PD-010: emit `T | (() => T) | undefined` for path params so Svelte 5
      // callers can pass a reactive getter without `state_referenced_locally`.
      pathParamsAsGetters: true,
      query: {
        importPath: '@tanstack/svelte-query',
        methods: ['get'],
      },
      mutation: {
        importPath: '@tanstack/svelte-query',
        methods: ['post', 'put', 'delete', 'patch'],
      },
    }),
  ],
});
