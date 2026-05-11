/** @jsxImportSource @kubb/react-fabric */
import { getDefaultValue, isOptional, type Operation } from '@kubb/oas';
import type { OperationSchemas } from '@kubb/plugin-oas';
import { getComments, getPathParams } from '@kubb/plugin-oas/utils';
import { File, Function, FunctionParams } from '@kubb/react-fabric';
import type { FabricReactNode } from '@kubb/react-fabric/types';
import type { PluginSvelteQuery } from '../types.ts';
import { QueryKey } from './QueryKey.tsx';
import { QueryOptions } from './QueryOptions.tsx';

type Props = {
  /**
   * Name of the function
   */
  name: string;
  queryOptionsName: string;
  queryKeyName: string;
  queryKeyTypeName: string;
  typeSchemas: OperationSchemas;
  operation: Operation;
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing'];
  paramsType: PluginSvelteQuery['resolvedOptions']['paramsType'];
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType'];
  /** PD-010 / pathParamsAsGetters: when true the path-param signature
   *  accepts `T | (() => T) | undefined` and the body unwraps via
   *  `typeof v === 'function' ? v() : v`. */
  pathParamsAsGetters: PluginSvelteQuery['resolvedOptions']['pathParamsAsGetters'];
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType'];
};

type GetParamsProps = {
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing'];
  paramsType: PluginSvelteQuery['resolvedOptions']['paramsType'];
  pathParamsType: PluginSvelteQuery['resolvedOptions']['pathParamsType'];
  pathParamsAsGetters: PluginSvelteQuery['resolvedOptions']['pathParamsAsGetters'];
  dataReturnType: PluginSvelteQuery['resolvedOptions']['client']['dataReturnType'];
  typeSchemas: OperationSchemas;
};

/** Build the `override` callback handed to `getPathParams`. When
 *  `pathParamsAsGetters` is on, the emitted type widens to
 *  `T | (() => T) | undefined` so callers can pass a Svelte-reactive
 *  getter (`() => jobId`) without tripping `state_referenced_locally`.
 *  Exported for unit tests; internal API otherwise.
 *  The input shape matches kubb's `FunctionParamsAST` — at this point
 *  upstream's `getPathParams` has already attached a concrete `type`. */
export function buildPathParamTypeOverride(pathParamsAsGetters: boolean) {
  return <T extends { type?: string }>(item: T): T => {
    const t = item.type;
    if (!t) return item;
    // The value form already permits `T | undefined`, so the getter form
    // mirrors that and accepts `() => T | undefined` too. This matches
    // SvelteKit route params like `$page.params.id` (typed `string | undefined`)
    // which would otherwise be rejected by a stricter `() => T`.
    return {
      ...item,
      type: pathParamsAsGetters
        ? `${t} | (() => ${t} | undefined) | undefined`
        : `${t} | undefined`,
    };
  };
}

function getParams({
  paramsType,
  paramsCasing,
  pathParamsType,
  pathParamsAsGetters,
  dataReturnType,
  typeSchemas,
}: GetParamsProps) {
  const TData =
    dataReturnType === 'data'
      ? typeSchemas.response.name
      : `ResponseConfig<${typeSchemas.response.name}>`;
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`;
  // `pathParamsAsGetters` is declared optional on ResolvedOptions for
  // variance reasons (see types.ts); plugin.ts guarantees a default.
  const asGetters = pathParamsAsGetters ?? false;
  const override = buildPathParamTypeOverride(asGetters);

  if (paramsType === 'object') {
    const pathParams = getPathParams(typeSchemas.pathParams, {
      typed: true,
      casing: paramsCasing,
      override,
    });

    const children = {
      ...pathParams,
      data: typeSchemas.request?.name
        ? {
            type: typeSchemas.request?.name,
            optional: isOptional(typeSchemas.request?.schema),
          }
        : undefined,
      params: typeSchemas.queryParams?.name
        ? {
            type: typeSchemas.queryParams?.name,
            optional: isOptional(typeSchemas.queryParams?.schema),
          }
        : undefined,
      headers: typeSchemas.headerParams?.name
        ? {
            type: typeSchemas.headerParams?.name,
            optional: isOptional(typeSchemas.headerParams?.schema),
          }
        : undefined,
    };

    // Check if all children are optional or undefined
    const allChildrenAreOptional = Object.values(children).every(
      (child) => !child || child.optional,
    );

    return FunctionParams.factory({
      data: {
        mode: 'object',
        children,
        default: allChildrenAreOptional ? '{}' : undefined,
      },
      options: {
        type: `
{
  query?: Partial<CreateBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}
`,
        default: '{}',
      },
    });
  }

  return FunctionParams.factory({
    pathParams: typeSchemas.pathParams?.name
      ? {
          mode: pathParamsType === 'object' ? 'object' : 'inlineSpread',
          children: getPathParams(typeSchemas.pathParams, {
            typed: true,
            casing: paramsCasing,
            override,
          }),
          default: getDefaultValue(typeSchemas.pathParams?.schema),
        }
      : undefined,
    data: typeSchemas.request?.name
      ? {
          type: typeSchemas.request?.name,
          optional: isOptional(typeSchemas.request?.schema),
        }
      : undefined,
    params: typeSchemas.queryParams?.name
      ? {
          type: typeSchemas.queryParams?.name,
          optional: isOptional(typeSchemas.queryParams?.schema),
        }
      : undefined,
    headers: typeSchemas.headerParams?.name
      ? {
          type: typeSchemas.headerParams?.name,
          optional: isOptional(typeSchemas.headerParams?.schema),
        }
      : undefined,
    options: {
      type: `
{
  query?: Partial<CreateBaseQueryOptions<${[TData, TError, 'TData', 'TQueryData', 'TQueryKey'].join(', ')}>> & { client?: QueryClient },
  client?: ${typeSchemas.request?.name ? `Partial<RequestConfig<${typeSchemas.request?.name}>> & { client?: Client }` : 'Partial<RequestConfig> & { client?: Client }'}
}
`,
      default: '{}',
    },
  });
}

/** When `pathParamsAsGetters` is on, the outer hook receives each path
 *  param as `T | (() => T) | undefined`. Generate one unwrap statement
 *  per path param so downstream `queryKey(...)` / `queryOptions(...)`
 *  calls receive plain values. We unwrap into shadow variables
 *  `${name}_` and rewrite the inner call expressions to use those. */
function buildPathParamUnwrap(
  typeSchemas: OperationSchemas,
  paramsCasing: PluginSvelteQuery['resolvedOptions']['paramsCasing'],
): { prelude: string; rename: (expr: string) => string } {
  if (!typeSchemas.pathParams?.name) {
    return { prelude: '', rename: (expr) => expr };
  }
  const pathParamMap = getPathParams(typeSchemas.pathParams, {
    typed: false,
    casing: paramsCasing,
  });
  const names = Object.keys(pathParamMap);
  if (names.length === 0) return { prelude: '', rename: (expr) => expr };
  // TypeScript narrows `typeof x === 'function'` to the function member
  // of the union; the else branch keeps the original `T | undefined`.
  // No casts needed — the resulting `${n}_` has the narrow type the
  // downstream QueryKey/QueryOptions calls expect.
  const prelude = names
    .map((n) => `const ${n}_ = typeof ${n} === 'function' ? ${n}() : ${n};`)
    .join('\n');
  const rename = (expr: string) =>
    names.reduce((acc, n) => acc.replace(new RegExp(`\\b${n}\\b`, 'g'), `${n}_`), expr);
  return { prelude, rename };
}

export function Query({
  name,
  queryKeyTypeName,
  queryOptionsName,
  queryKeyName,
  paramsType,
  paramsCasing,
  pathParamsType,
  pathParamsAsGetters,
  dataReturnType,
  typeSchemas,
  operation,
}: Props): FabricReactNode {
  const TData =
    dataReturnType === 'data'
      ? typeSchemas.response.name
      : `ResponseConfig<${typeSchemas.response.name}>`;
  const TError = `ResponseErrorConfig<${typeSchemas.errors?.map((item) => item.name).join(' | ') || 'Error'}>`;
  const returnType = `CreateQueryResult<${['TData', TError].join(', ')}> & { queryKey: TQueryKey }`;
  const generics = [
    `TData = ${TData}`,
    `TQueryData = ${TData}`,
    `TQueryKey extends QueryKey = ${queryKeyTypeName}`,
  ];

  const queryKeyParams = QueryKey.getParams({
    pathParamsType,
    paramsCasing,
    typeSchemas,
  });
  const queryOptionsParams = QueryOptions.getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    typeSchemas,
  });
  // See helper comment on the inner-scoped `asGetters` — ResolvedOptions
  // declares `pathParamsAsGetters` optional for variance, so we coerce.
  const asGetters = pathParamsAsGetters ?? false;
  const params = getParams({
    paramsType,
    paramsCasing,
    pathParamsType,
    pathParamsAsGetters: asGetters,
    dataReturnType,
    typeSchemas,
  });

  const { prelude, rename } = asGetters
    ? buildPathParamUnwrap(typeSchemas, paramsCasing)
    : { prelude: '', rename: (expr: string) => expr };

  const queryOptions = `${queryOptionsName}(${rename(queryOptionsParams.toCall())})`;
  const queryKeyCall = `${queryKeyName}(${rename(queryKeyParams.toCall())})`;

  return (
    <File.Source name={name} isExportable isIndexable>
      <Function
        name={name}
        export
        generics={generics.join(', ')}
        params={params.toConstructor()}
        JSDoc={{
          comments: getComments(operation),
        }}
      >
        {`
       ${prelude}
       const { query: queryConfig = {}, client: config = {} } = options ?? {}
       const { client: queryClient, ...resolvedOptions } = queryConfig
       const queryKey = resolvedOptions?.queryKey ?? ${queryKeyCall}

       const query = createQuery({
        ...${queryOptions},
        ...resolvedOptions,
        queryKey,
       } as unknown as CreateBaseQueryOptions, queryClient) as ${returnType}

       query.queryKey = queryKey as TQueryKey

       return query
       `}
      </Function>
    </File.Source>
  );
}

Query.getParams = getParams;
