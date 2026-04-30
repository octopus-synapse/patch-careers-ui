<script lang="ts">
  /**
   * Health page — endpoint backend ainda não está exposto pelo OpenAPI
   * (SSE/health checks foram omitidos da spec client-only). Usa banner.
   */
  import ComingSoonBanner from '$lib/components/layout/coming-soon-banner.svelte';
  import { locale } from '$lib/state/locale.svelte';

  const t = $derived(locale.t);
</script>

<svelte:head>
  <title>{t('admin.health.title')}</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
    {t('admin.health.title')}
  </h1>

  <ComingSoonBanner
    title={t('admin.health.title')}
    description="O endpoint /platform/check ainda não foi exposto pela spec client-only. Volte quando o backend publicar a rota tipada."
  />
</div>
