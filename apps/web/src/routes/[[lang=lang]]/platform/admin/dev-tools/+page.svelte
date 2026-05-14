<script lang="ts">
import { FlaskConical, Radio, Bug } from 'lucide-svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const tools = $derived([
  {
    href: '/platform/admin/dev-tools/test',
    icon: FlaskConical,
    label: t('admin.devTools.toolAdminTestRunnerLabel'),
    description: t('admin.devTools.toolAdminTestRunnerDescription'),
  },
  {
    href: '/platform/admin/dev-tools/backend-connection',
    icon: Radio,
    label: t('admin.devTools.toolBackendConnectionLabel'),
    description: t('admin.devTools.toolBackendConnectionDescription'),
  },
  {
    href: '/platform/admin/dev-tools/test-404',
    icon: Bug,
    label: t('admin.devTools.toolTest404Label'),
    description: t('admin.devTools.toolTest404Description'),
  },
]);
</script>

<div class="space-y-6">
  <header>
    <h1 class="text-2xl font-semibold text-gray-900 dark:text-neutral-100">{t('admin.devTools.heading')}</h1>
    <p class="text-sm text-gray-500 dark:text-neutral-400 mt-1">
      Ferramentas internas de desenvolvimento e diagnóstico. Disponíveis apenas para administradores.
    </p>
  </header>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each tools as tool}
      {@const Icon = tool.icon}
      <a
        href={tool.href}
        class="flex flex-col gap-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 transition-colors hover:border-gray-400 dark:hover:border-neutral-600"
      >
        <div class="flex items-center gap-2 text-gray-800 dark:text-neutral-200">
          <Icon size={20} />
          <span class="font-medium">{tool.label}</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-neutral-400">{tool.description}</p>
      </a>
    {/each}
  </div>
</div>
