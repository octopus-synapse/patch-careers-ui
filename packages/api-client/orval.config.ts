import * as path from 'node:path';
import { defineConfig } from 'orval';

const BACKEND_URL = process.env.BACKEND_URL;
const localSwaggerPath = path.resolve(
  __dirname,
  '../../../profile-services/client-swagger.json',
);
const inputSource = BACKEND_URL
  ? `${BACKEND_URL}/api/client-swagger-json`
  : localSwaggerPath;

export default defineConfig({
  api: {
    input: {
      target: inputSource,
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/api/endpoints.ts',
      schemas: './src/generated/models',
      client: 'svelte-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/client/fetcher.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          useSuspenseQuery: false,
          usePrefetch: true,
          signal: true,
        },
      },
    },
  },
  apiZod: {
    input: {
      target: inputSource,
    },
    output: {
      mode: 'tags-split',
      target: './src/generated/zod/endpoints.ts',
      client: 'zod',
      fileExtension: '.zod.ts',
      clean: true,
      override: {
        zod: {
          generate: {
            body: true,
            param: false,
            query: false,
            header: false,
            response: false,
          },
        },
      },
    },
  },
});
