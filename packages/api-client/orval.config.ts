import * as path from 'node:path';
import { defineConfig } from 'orval';

const BACKEND_URL = process.env.BACKEND_URL;
const localSwaggerPath = path.resolve(__dirname, '../../../profile-services/swagger.json');
const inputSource = BACKEND_URL ? `${BACKEND_URL}/openapi.json` : localSwaggerPath;

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
});
