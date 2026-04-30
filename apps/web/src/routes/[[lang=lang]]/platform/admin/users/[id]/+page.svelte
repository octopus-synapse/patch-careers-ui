<script lang="ts">
  /**
   * Admin user-detail page is a stub: the backend has user listing
   * (`GET /v1/admin/users`) but no per-user impersonate / role-edit
   * endpoint shipped yet. Render a `<ComingSoonBanner>` until F4 wires
   * it up. Route stays so admin sidebar links don't 404.
   */
  import { page } from '$app/stores';
  import ComingSoonBanner from '$lib/components/layout/coming-soon-banner.svelte';
</script>

<svelte:head>
  <title>Detalhes do usuário · Patch Careers Admin</title>
</svelte:head>

<main class="mx-auto max-w-3xl p-6">
  <header class="mb-6 flex items-center justify-between gap-3">
    <div>
      <a class="text-xs text-muted-foreground underline" href="../">← Voltar para a lista</a>
      <h1 class="mt-2 text-xl font-semibold">Usuário {$page.params.id}</h1>
    </div>
  </header>

  <ComingSoonBanner
    title="Detalhe do usuário (admin) em breve"
    description="A página completa com edição de papéis, suspensão e impersonate ainda não foi liberada — depende de endpoints administrativos que serão entregues na próxima fase."
  />
</main>
