<script lang="ts">
import { AlertTriangle, Shield } from 'lucide-svelte';
import { DataTable } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

// Stub: backend endpoint GET /admin/audit-log is not yet implemented.
// Once available, replace the empty data with createAdminAuditList(...) and wire
// filters (actor, action, target, date range) through the existing search/filter components.
const BACKEND_READY = false;

const columns = $derived([
  { key: 'timestamp', label: t('admin.audit.timestamp'), width: '180px', sortable: true },
  { key: 'actor', label: t('admin.audit.actor'), sortable: true },
  { key: 'action', label: t('admin.audit.action'), sortable: true },
  { key: 'target', label: t('admin.audit.target') },
  { key: 'metadata', label: t('admin.audit.metadata') },
]);
</script>

<svelte:head>
	<title>{t('admin.audit.title')}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<Shield size={18} class="text-gray-500 dark:text-neutral-500" />
		<h1 class="text-lg sm:text-xl font-semibold tracking-tight text-gray-800 dark:text-neutral-200">
			{t('admin.audit.title')}
		</h1>
	</div>

	{#if !BACKEND_READY}
		<div class="flex items-start gap-3 rounded-lg border px-4 py-3 border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/30">
			<AlertTriangle size={16} class="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
			<div class="flex-1 text-xs text-amber-800 dark:text-amber-300">
				<p class="font-semibold">{t('admin.audit.backendPendingTitle')}</p>
				<p class="mt-1">{t('admin.audit.backendPendingDescription')}</p>
			</div>
		</div>
	{/if}

	<DataTable {columns} data={[]} loading={false} emptyMessage={t('admin.audit.noEntries')} />
</div>
