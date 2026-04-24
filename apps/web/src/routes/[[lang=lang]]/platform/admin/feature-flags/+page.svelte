<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    adminFeatureFlagsBroadcastRefresh,
    adminFeatureFlagsGetImpact,
    adminFeatureFlagsUpdateFlag,
    createAdminFeatureFlagsListAll,
    getAdminFeatureFlagsListAllQueryKey,
    getFeatureFlagsEvaluateQueryKey,
    type FeatureFlagAdminRowDto,
    type FeatureFlagImpactNodeDto,
  } from 'api-client';
  import {
    AlertTriangle,
    Bell,
    Briefcase,
    ChevronDown,
    CreditCard,
    FileText,
    FlaskConical,
    Flag,
    MessageCircle,
    Plug,
    RefreshCw,
    Search,
    Users,
    X,
  } from 'lucide-svelte';
  import { Button, Modal, Tooltip, toastState } from 'ui';

  function toastError(msg: string) {
    toastState.show(msg, 'danger');
  }
  function toastSuccess(msg: string) {
    toastState.show(msg, 'success');
  }
  import { browser } from '$app/environment';
  import { locale } from '$lib/state/locale.svelte';
  import { translateApiError } from '$lib/utils/translate-api-error';

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  const flagsQuery = createAdminFeatureFlagsListAll(() => ({
    query: { enabled: browser },
  }));

  const rows = $derived<FeatureFlagAdminRowDto[]>(flagsQuery.data?.flags ?? []);
  const sortedRows = $derived([...rows].sort((a, b) => a.key.localeCompare(b.key)));

  // ── Filter + search state ────────────────────────────────────────────
  type FilterMode = 'all' | 'on' | 'off' | 'deprecated' | 'blocked';
  let filterMode = $state<FilterMode>('all');
  let search = $state('');

  function matchesFilter(row: FeatureFlagAdminRowDto): boolean {
    const blocked = !row.enabled && row.blockedBy.length > 0;
    switch (filterMode) {
      case 'on':
        return row.effectiveGlobal;
      case 'off':
        return !row.effectiveGlobal && !row.deprecated;
      case 'deprecated':
        return row.deprecated;
      case 'blocked':
        return blocked;
      case 'all':
      default:
        return true;
    }
  }

  function matchesSearch(row: FeatureFlagAdminRowDto): boolean {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.key.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q)
    );
  }

  const filteredRows = $derived(
    sortedRows.filter((r) => matchesFilter(r) && matchesSearch(r)),
  );

  // ── Stats (derived from all rows, not filtered) ──────────────────────
  const stats = $derived({
    total: rows.length,
    on: rows.filter((r) => r.effectiveGlobal).length,
    off: rows.filter((r) => !r.effectiveGlobal && !r.deprecated).length,
    deprecated: rows.filter((r) => r.deprecated).length,
  });

  // ── Grouping by root key (first segment) ─────────────────────────────
  type Group = {
    key: string;
    label: string;
    icon: typeof FileText;
    rows: FeatureFlagAdminRowDto[];
  };

  const groupIcons: Record<string, typeof FileText> = {
    resumes: FileText,
    jobs: Briefcase,
    social: Users,
    chat: MessageCircle,
    notifications: Bell,
    billing: CreditCard,
    integrations: Plug,
    experiments: FlaskConical,
  };

  const groupLabels: Record<string, string> = {
    resumes: 'Currículos',
    jobs: 'Vagas',
    social: 'Social',
    chat: 'Chat',
    notifications: 'Notificações',
    billing: 'Cobrança',
    integrations: 'Integrações',
    experiments: 'Experimentos',
  };

  const groups = $derived.by<Group[]>(() => {
    const map = new Map<string, FeatureFlagAdminRowDto[]>();
    for (const row of filteredRows) {
      const root = row.key.split('.')[0];
      if (!map.has(root)) map.set(root, []);
      map.get(root)!.push(row);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, groupRows]) => ({
        key,
        label: groupLabels[key] ?? key,
        icon: groupIcons[key] ?? Flag,
        rows: groupRows,
      }));
  });

  // ── Collapsible groups (all expanded by default) ─────────────────────
  let collapsed = $state<Set<string>>(new Set());
  function toggleGroup(key: string) {
    const next = new Set(collapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    collapsed = next;
  }

  // ── Toggle + confirmation ────────────────────────────────────────────
  type PendingToggle = { row: FeatureFlagAdminRowDto; nextEnabled: boolean; impact: FeatureFlagImpactNodeDto | null };
  let pending = $state<PendingToggle | null>(null);
  let pendingLoading = $state(false);
  let broadcastLoading = $state(false);

  function flattenImpact(node: FeatureFlagImpactNodeDto, depth = 0): Array<{ key: string; depth: number }> {
    const out: Array<{ key: string; depth: number }> = [{ key: node.key, depth }];
    for (const c of node.children) out.push(...flattenImpact(c, depth + 1));
    return out;
  }

  async function beginToggle(row: FeatureFlagAdminRowDto) {
    if (row.deprecated) {
      toastError('Flag depreciada — remova do registry ou re-adicione no código.');
      return;
    }
    if (row.blockedBy.length > 0 && !row.enabled) {
      toastError(`Bloqueado por: ${row.blockedBy.join(', ')}`);
      return;
    }
    const nextEnabled = !row.enabled;
    if (!nextEnabled) {
      try {
        const impact = await adminFeatureFlagsGetImpact(row.key);
        pending = { row, nextEnabled, impact: impact.tree };
      } catch (err) {
        toastError(translateApiError(err, t));
      }
      return;
    }
    pending = { row, nextEnabled, impact: null };
  }

  async function applyToggle() {
    if (!pending) return;
    pendingLoading = true;
    try {
      await adminFeatureFlagsUpdateFlag(pending.row.key, { enabled: pending.nextEnabled });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getAdminFeatureFlagsListAllQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getFeatureFlagsEvaluateQueryKey() }),
      ]);
      pending = null;
    } catch (err) {
      toastError(translateApiError(err, t));
    } finally {
      pendingLoading = false;
    }
  }

  async function broadcastRefresh() {
    broadcastLoading = true;
    try {
      await adminFeatureFlagsBroadcastRefresh();
      toastSuccess('Broadcast enviado — todos os clientes conectados vão recarregar flags.');
    } catch (err) {
      toastError(translateApiError(err, t));
    } finally {
      broadcastLoading = false;
    }
  }

  function depthOf(key: string): number {
    return key.split('.').length - 1;
  }

  function childKey(key: string): string {
    const parts = key.split('.');
    return parts.length === 1 ? key : parts.slice(1).join('.');
  }
</script>

<div class="mx-auto max-w-6xl space-y-6 p-6">
  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <div class="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-500">
        <Flag size={12} />
        <span>Platform · Admin</span>
      </div>
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
        Feature Flags
      </h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
        Liga e desliga módulos do produto em runtime. Dependências cascatam automaticamente.
      </p>
    </div>
    <Button onclick={broadcastRefresh} disabled={broadcastLoading} intent="neutral" variant="outline">
      <RefreshCw size={14} class={broadcastLoading ? 'animate-spin' : ''} />
      <span class="ml-2">Broadcast refresh</span>
    </Button>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {@render stat('Total', stats.total, 'text-gray-900 dark:text-neutral-100')}
    {@render stat('Ativas', stats.on, 'text-emerald-600 dark:text-emerald-400')}
    {@render stat('Desligadas', stats.off, 'text-gray-500 dark:text-neutral-400')}
    {@render stat('Depreciadas', stats.deprecated, 'text-amber-600 dark:text-amber-400')}
  </div>

  <!-- Filter bar -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <div class="relative flex-1">
      <Search size={14} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500" />
      <input
        type="text"
        bind:value={search}
        placeholder="Buscar por chave ou nome…"
        class="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-500"
      />
      {#if search}
        <button type="button" aria-label="Limpar busca" onclick={() => (search = '')} class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300">
          <X size={14} />
        </button>
      {/if}
    </div>

    <div class="flex flex-wrap gap-1 rounded-md border border-gray-200 bg-gray-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
      {@render filterChip('all', 'Todas', stats.total)}
      {@render filterChip('on', 'Ativas', stats.on)}
      {@render filterChip('off', 'Desligadas', stats.off)}
      {#if stats.deprecated > 0}
        {@render filterChip('deprecated', 'Depreciadas', stats.deprecated)}
      {/if}
    </div>
  </div>

  <!-- Groups -->
  {#if flagsQuery.isLoading}
    <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      Carregando flags…
    </div>
  {:else if groups.length === 0}
    <div class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      {#if search || filterMode !== 'all'}
        Nenhuma flag combina com o filtro atual.
      {:else}
        Nenhuma flag cadastrada.
      {/if}
    </div>
  {:else}
    <div class="space-y-4">
      {#each groups as group (group.key)}
        {@const isCollapsed = collapsed.has(group.key)}
        {@const onCount = group.rows.filter((r) => r.effectiveGlobal).length}
        {@const Icon = group.icon}
        <section class="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onclick={() => toggleGroup(group.key)}
            class="flex w-full items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/50"
            aria-expanded={!isCollapsed}
          >
            <ChevronDown
              size={14}
              class="shrink-0 text-gray-500 transition-transform {isCollapsed ? '-rotate-90' : ''} dark:text-neutral-400"
            />
            <Icon size={16} class="shrink-0 text-gray-600 dark:text-neutral-400" />
            <div class="flex flex-1 items-center gap-2">
              <span class="text-sm font-semibold text-gray-900 dark:text-neutral-100">{group.label}</span>
              <span class="font-mono text-xs text-gray-400 dark:text-neutral-500">{group.key}</span>
            </div>
            <span class="font-mono text-xs tabular-nums text-gray-500 dark:text-neutral-400">
              {onCount} / {group.rows.length} ativas
            </span>
          </button>

          {#if !isCollapsed}
            <ul class="divide-y divide-gray-100 dark:divide-neutral-800">
              {#each group.rows as row (row.key)}
                {@const blocked = !row.enabled && row.blockedBy.length > 0}
                {@const effective = row.effectiveGlobal}
                {@const depth = depthOf(row.key)}
                <li class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                  <!-- Tree indent -->
                  <div class="flex shrink-0 items-center" style:width="{depth * 20}px">
                    {#if depth > 0}
                      <span class="font-mono text-xs text-gray-300 dark:text-neutral-700">└─</span>
                    {/if}
                  </div>

                  <!-- Name + key -->
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-medium text-gray-900 dark:text-neutral-100">{row.name}</span>
                      {#if row.deprecated}
                        <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          deprecated
                        </span>
                      {/if}
                      {#if blocked}
                        <Tooltip text={`Bloqueado por: ${row.blockedBy.join(', ')}`}>
                          <span class="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            <AlertTriangle size={10} />
                            bloqueado
                          </span>
                        </Tooltip>
                      {/if}
                      {#if row.enabledForRoles.length > 0}
                        <Tooltip text={`Apenas roles: ${row.enabledForRoles.join(', ')}`}>
                          <span class="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            role-gated
                          </span>
                        </Tooltip>
                      {/if}
                    </div>
                    <div class="mt-0.5 font-mono text-xs text-gray-500 dark:text-neutral-500">
                      {depth > 0 ? '.' + childKey(row.key) : row.key}
                    </div>
                  </div>

                  <!-- Status label -->
                  <div class="hidden shrink-0 font-mono text-[10px] uppercase tracking-wider sm:block">
                    {#if effective}
                      <span class="text-emerald-600 dark:text-emerald-400">ON</span>
                    {:else if blocked}
                      <span class="text-amber-600 dark:text-amber-400">BLOCKED</span>
                    {:else}
                      <span class="text-gray-400 dark:text-neutral-500">OFF</span>
                    {/if}
                  </div>

                  <!-- Switch -->
                  <button
                    type="button"
                    role="switch"
                    aria-checked={effective}
                    aria-label={`${effective ? 'Desligar' : 'Ligar'} ${row.name}`}
                    disabled={row.deprecated || blocked}
                    onclick={() => beginToggle(row)}
                    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-neutral-900 {effective
                      ? 'border-emerald-600 bg-emerald-500 focus:ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-600'
                      : 'border-gray-300 bg-gray-200 focus:ring-gray-400 dark:border-neutral-700 dark:bg-neutral-800'}"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 {effective ? 'translate-x-6' : 'translate-x-1'}"
                    ></span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    </div>
  {/if}
</div>

{#snippet stat(label: string, value: number, valueClass: string)}
  <div class="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
    <p class="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-neutral-500">
      {label}
    </p>
    <p class="mt-1 text-2xl font-semibold tabular-nums {valueClass}">{value}</p>
  </div>
{/snippet}

{#snippet filterChip(mode: FilterMode, label: string, count: number)}
  {@const active = filterMode === mode}
  <button
    type="button"
    onclick={() => (filterMode = mode)}
    class="rounded px-2.5 py-1 text-xs font-medium transition-colors {active
      ? 'bg-white text-gray-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
      : 'text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200'}"
  >
    {label}
    <span class="ml-1 font-mono text-[10px] tabular-nums opacity-60">{count}</span>
  </button>
{/snippet}

<Modal open={pending !== null} onClose={() => (pending = null)}>
  {#snippet title()}
    {pending?.nextEnabled ? `Ligar "${pending?.row.key}"?` : `Desligar "${pending?.row.key}"?`}
  {/snippet}

  {#if pending && !pending.nextEnabled && pending.impact}
    {@const flattened = flattenImpact(pending.impact)}
    <div class="mb-4 space-y-2">
      <p class="text-sm text-gray-700 dark:text-neutral-300">
        {#if flattened.length === 1}
          Nenhuma outra feature depende desta.
        {:else}
          As seguintes features ficarão efetivamente OFF (cascata):
        {/if}
      </p>
      {#if flattened.length > 1}
        <ul class="max-h-64 space-y-0.5 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-950">
          {#each flattened as node (node.key)}
            <li style:padding-left="{node.depth * 16}px" class="text-gray-700 dark:text-neutral-300">
              {node.depth > 0 ? '└─ ' : ''}<span class={node.depth === 0 ? 'font-semibold text-gray-900 dark:text-neutral-100' : ''}>{node.key}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if pending?.nextEnabled}
    <p class="mb-4 text-sm text-gray-700 dark:text-neutral-300">
      Ligar esta feature a deixará disponível conforme suas dependências e restrições de role.
    </p>
  {/if}

  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="outline" size="sm" onclick={() => (pending = null)} disabled={pendingLoading}>
      Cancelar
    </Button>
    <Button
      variant="solid"
      size="sm"
      intent={pending?.nextEnabled ? 'accent' : 'danger'}
      onclick={applyToggle}
      disabled={pendingLoading}
    >
      {pending?.nextEnabled ? 'Ligar' : 'Desligar'}
    </Button>
  </div>
</Modal>
