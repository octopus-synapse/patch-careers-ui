import type { Group, Output, PluginFactoryOptions, ResolveNameParams } from '@kubb/core';
import type { contentType, HttpMethod, Oas, Operation } from '@kubb/oas';
import type { ClientImportPath, PluginClient } from '@kubb/plugin-client';
import type {
  Exclude,
  Include,
  OperationSchemas,
  Override,
  ResolvePathOptions,
} from '@kubb/plugin-oas';
import type { Generator } from '@kubb/plugin-oas/generators';

// Fork delta: upstream re-exports `Transformer` from `@internals/tanstack-query`.
// The shape is tiny and stable, so we inline it instead of pulling in the
// workspace-private internals package.
export type Transformer = (props: {
  operation: Operation;
  schemas: OperationSchemas;
  casing: 'camelcase' | undefined;
}) => unknown[];

/**
 * Customize the queryKey
 */
type QueryKey = Transformer;

/**
 * Customize the mutationKey
 */
type MutationKey = Transformer;

type Query = {
  /**
   * Define which HttpMethods can be used for queries
   * @default ['get']
   */
  methods: Array<HttpMethod>;
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/svelte-query'
   */
  importPath?: string;
};

type Mutation = {
  /**
   * Define which HttpMethods can be used for mutations
   * @default ['post', 'put', 'delete']
   */
  methods: Array<HttpMethod>;
  /**
   * Path to the useQuery hook for useQuery functionality.
   * Used as `import { useQuery } from '${importPath}'`.
   * Accepts relative and absolute paths.
   * Path is used as-is; relative paths are based on the generated file location.
   * @default '@tanstack/svelte-query'
   */
  importPath?: string;
};

export type Options = {
  /**
   * Specify the export location for the files and define the behavior of the output
   * @default { path: 'hooks', barrelType: 'named' }
   */
  output?: Output<Oas>;
  /**
   * Define which contentType should be used.
   * By default, the first JSON valid mediaType is used
   */
  contentType?: contentType;
  /**
   * Group the @tanstack/query hooks based on the provided name.
   */
  group?: Group;
  client?: ClientImportPath &
    Pick<
      PluginClient['options'],
      'clientType' | 'dataReturnType' | 'baseURL' | 'bundle' | 'paramsCasing'
    >;
  /**
   * Array containing exclude parameters to exclude/skip tags/operations/methods/paths.
   */
  exclude?: Array<Exclude>;
  /**
   * Array containing include parameters to include tags/operations/methods/paths.
   */
  include?: Array<Include>;
  /**
   * Array containing override parameters to override `options` based on tags/operations/methods/paths.
   */
  override?: Array<Override<ResolvedOptions>>;
  /**
   * How to style your params, by default no casing is applied
   * - 'camelcase' uses camelcase for the params names
   */
  paramsCasing?: 'camelcase';
  /**
   * How to pass your params
   * - 'object' returns the params and pathParams as an object.
   * - 'inline' returns the params as comma separated params.
   * @default 'inline'
   */
  paramsType?: 'object' | 'inline';
  /**
   * How to pass your pathParams.
   * - 'object' returns the pathParams as an object.
   * - 'inline': returns the pathParams as comma separated params.
   * @default 'inline'
   */
  pathParamsType?: PluginClient['options']['pathParamsType'];
  queryKey?: QueryKey;
  /**
   * Override some useQuery behaviors.
   */
  query?: Partial<Query> | false;
  mutationKey?: MutationKey;
  /**
   * Override some useMutation behaviors.
   */
  mutation?: Partial<Mutation> | false;
  /**
   * Which parser should be used before returning the data to `@tanstack/query`.
   * `'zod'` uses `@kubb/plugin-zod` to parse the data.
   */
  parser?: PluginClient['options']['parser'];
  /**
   * When `true`, generated query and mutation hooks accept path params as
   * either a plain value or a zero-arg getter: `T | (() => T)`.
   *
   * Use case (PD-010): Svelte 5 components hit `state_referenced_locally`
   * compiler warnings when a `$state`/`$derived` variable is read as the
   * first argument of a kubb-generated hook (e.g.,
   * `createGetV1JobsId(jobId, ...)`). Passing a getter (`() => jobId`)
   * keeps the read inside a closure that re-evaluates on each access,
   * which is how Svelte 5 wants reactive reads to flow.
   *
   * Default: `false` — backward-compatible, no signature changes.
   *
   * Runtime cost: a single `typeof === 'function'` check per call.
   *
   * @default false
   */
  pathParamsAsGetters?: boolean;
  transformers?: {
    /**
     * Customize the names based on the type that is provided by the plugin.
     */
    name?: (name: ResolveNameParams['name'], type?: ResolveNameParams['type']) => string;
  };
  /**
   * Define some generators next to the svelte-query generators
   */
  generators?: Array<Generator<PluginSvelteQuery>>;
};

type ResolvedOptions = {
  output: Output<Oas>;
  group: Options['group'];
  client: Pick<
    PluginClient['options'],
    | 'client'
    | 'clientType'
    | 'dataReturnType'
    | 'importPath'
    | 'baseURL'
    | 'bundle'
    | 'paramsCasing'
  >;
  parser: Required<NonNullable<Options['parser']>>;
  paramsCasing: Options['paramsCasing'];
  paramsType: NonNullable<Options['paramsType']>;
  pathParamsType: NonNullable<Options['pathParamsType']>;
  /** See `Options.pathParamsAsGetters`. Plugin.ts assigns a `false`
   *  default at runtime, so it is always defined when read by the
   *  generator; declared optional here only to keep the structural
   *  type assignable to upstream's `ResolvedOptions` (variance fix for
   *  consumers that mix this fork's plugin with upstream-typed pieces). */
  pathParamsAsGetters?: boolean;
  queryKey: QueryKey | undefined;
  query: NonNullable<Required<Query>> | false;
  mutationKey: MutationKey | undefined;
  mutation: NonNullable<Required<Mutation>> | false;
};

export type PluginSvelteQuery = PluginFactoryOptions<
  'plugin-svelte-query',
  Options,
  ResolvedOptions,
  never,
  ResolvePathOptions
>;
