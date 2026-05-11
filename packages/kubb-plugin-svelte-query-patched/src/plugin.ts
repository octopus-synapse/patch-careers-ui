import path from 'node:path';
import { definePlugin, type Group, getBarrelFiles, getMode } from '@kubb/core';

// Fork delta: upstream imports `camelCase` / `pascalCase` from
// `@internals/utils` (workspace-private). Port the exact upstream
// implementation here so generated SDK names are byte-identical
// (e.g. `2faStatus`, `urlV1` retain upstream casing rules).
type CaseOptions = { isFile?: boolean; prefix?: string; suffix?: string };

function toCamelOrPascal(text: string, pascal: boolean): string {
  return text
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[\s\-_./\\:]+/)
    .filter(Boolean)
    .map((word, i) => {
      if (word.length > 1 && word === word.toUpperCase()) return word;
      if (i === 0 && !pascal) return word.charAt(0).toLowerCase() + word.slice(1);
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function applyToFileParts(
  text: string,
  transform: (part: string, isLast: boolean) => string,
): string {
  const parts = text.split('.');
  return parts.map((part, i) => transform(part, i === parts.length - 1)).join('/');
}

function camelCase(text: string, { isFile, prefix = '', suffix = '' }: CaseOptions = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) =>
      camelCase(part, isLast ? { prefix, suffix } : {}),
    );
  }
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, false);
}

function pascalCase(text: string, { isFile, prefix = '', suffix = '' }: CaseOptions = {}): string {
  if (isFile) {
    return applyToFileParts(text, (part, isLast) =>
      isLast ? pascalCase(part, { prefix, suffix }) : camelCase(part),
    );
  }
  return toCamelOrPascal(`${prefix} ${text} ${suffix}`, true);
}

import { pluginClientName } from '@kubb/plugin-client';
import { source as axiosClientSource } from '@kubb/plugin-client/templates/clients/axios.source';
import { source as fetchClientSource } from '@kubb/plugin-client/templates/clients/fetch.source';
import { source as configSource } from '@kubb/plugin-client/templates/config.source';
import { OperationGenerator, pluginOasName } from '@kubb/plugin-oas';
import { pluginTsName } from '@kubb/plugin-ts';
import { pluginZodName } from '@kubb/plugin-zod';
import { MutationKey, QueryKey } from './components';
import { mutationGenerator, queryGenerator } from './generators';
import type { PluginSvelteQuery } from './types.ts';

export const pluginSvelteQueryName = 'plugin-svelte-query' satisfies PluginSvelteQuery['name'];

export const pluginSvelteQuery = definePlugin<PluginSvelteQuery>((options) => {
  const {
    output = { path: 'hooks', barrelType: 'named' },
    group,
    exclude = [],
    include,
    override = [],
    parser = 'client',
    transformers = {},
    paramsType = 'inline',
    pathParamsType = paramsType === 'object' ? 'object' : options.pathParamsType || 'inline',
    pathParamsAsGetters = false,
    mutation = {},
    query = {},
    paramsCasing,
    mutationKey = MutationKey.getTransformer,
    queryKey = QueryKey.getTransformer,
    generators = [queryGenerator, mutationGenerator].filter(Boolean),
    contentType,
    client,
  } = options;

  const clientName = client?.client ?? 'axios';
  const clientImportPath =
    client?.importPath ??
    (!client?.bundle ? `@kubb/plugin-client/clients/${clientName}` : undefined);

  return {
    name: pluginSvelteQueryName,
    options: {
      output,
      client: {
        bundle: client?.bundle,
        baseURL: client?.baseURL,
        client: clientName,
        clientType: client?.clientType ?? 'function',
        dataReturnType: client?.dataReturnType ?? 'data',
        pathParamsType,
        importPath: clientImportPath,
        paramsCasing,
      },
      queryKey,
      query:
        query === false
          ? false
          : {
              methods: ['get'],
              importPath: '@tanstack/svelte-query',
              ...query,
            },
      mutationKey,
      mutation:
        mutation === false
          ? false
          : {
              methods: ['post', 'put', 'patch', 'delete'],
              importPath: '@tanstack/svelte-query',
              ...mutation,
            },
      paramsType,
      pathParamsType,
      pathParamsAsGetters,
      parser,
      paramsCasing,
      group,
    },
    pre: [pluginOasName, pluginTsName, parser === 'zod' ? pluginZodName : undefined].filter(
      (name): name is string => Boolean(name),
    ),
    resolvePath(baseName, pathMode, options) {
      const root = path.resolve(this.config.root, this.config.output.path);
      const mode = pathMode ?? getMode(path.resolve(root, output.path));

      if (mode === 'single') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output.path);
      }

      if (group && (options?.group?.path || options?.group?.tag)) {
        const groupName: Group['name'] = group?.name
          ? group.name
          : (ctx) => {
              if (group?.type === 'path') {
                return `${ctx.group.split('/')[1]}`;
              }
              return `${camelCase(ctx.group)}Controller`;
            };

        return path.resolve(
          root,
          output.path,
          groupName({
            group: group.type === 'path' ? options.group.path! : options.group.tag!,
          }),
          baseName,
        );
      }

      return path.resolve(root, output.path, baseName);
    },
    resolveName(name, type) {
      let resolvedName = camelCase(name);

      if (type === 'file' || type === 'function') {
        resolvedName = camelCase(name, {
          isFile: type === 'file',
        });
      }
      if (type === 'type') {
        resolvedName = pascalCase(name);
      }

      if (type) {
        return transformers?.name?.(resolvedName, type) || resolvedName;
      }

      return resolvedName;
    },
    async install() {
      const root = path.resolve(this.config.root, this.config.output.path);
      const mode = getMode(path.resolve(root, output.path));
      const oas = await this.getOas();
      const baseURL = await this.getBaseURL();

      if (baseURL) {
        this.plugin.options.client.baseURL = baseURL;
      }

      const hasClientPlugin = !!this.pluginManager.getPluginByKey([pluginClientName]);

      if (
        this.plugin.options.client.bundle &&
        !hasClientPlugin &&
        !this.plugin.options.client.importPath
      ) {
        // pre add bundled fetch
        await this.upsertFile({
          baseName: 'fetch.ts',
          path: path.resolve(root, '.kubb/fetch.ts'),
          sources: [
            {
              name: 'fetch',
              value:
                this.plugin.options.client.client === 'fetch'
                  ? fetchClientSource
                  : axiosClientSource,
              isExportable: true,
              isIndexable: true,
            },
          ],
          imports: [],
          exports: [],
        });
      }

      if (!hasClientPlugin) {
        await this.addFile({
          baseName: 'config.ts',
          path: path.resolve(root, '.kubb/config.ts'),
          sources: [
            {
              name: 'config',
              value: configSource,
              isExportable: false,
              isIndexable: false,
            },
          ],
          imports: [],
          exports: [],
        });
      }

      const operationGenerator = new OperationGenerator(this.plugin.options, {
        fabric: this.fabric,
        oas,
        pluginManager: this.pluginManager,
        events: this.events,
        plugin: this.plugin,
        contentType,
        exclude,
        include,
        override,
        mode,
      });

      const files = await operationGenerator.build(...generators);
      await this.upsertFile(...files);

      const barrelFiles = await getBarrelFiles(this.fabric.files, {
        type: output.barrelType ?? 'named',
        root,
        output,
        meta: {
          pluginKey: this.plugin.key,
        },
      });

      await this.upsertFile(...barrelFiles);
    },
  };
});
