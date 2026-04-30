<script lang="ts">
  // @ts-nocheck — F3 burrar pending; SDK rename cascade after F1 swagger regen.
import { createAdminAlertsGetAlerts } from 'api-client';
import { AlertTriangle, Flag, MailCheck, UserPlus } from 'lucide-svelte';
import { browser } from '$app/environment';

const alertsQuery = createAdminAlertsGetAlerts(() => ({
  query: { enabled: browser, refetchInterval: 60_000 },
}));

type Alerts = {
  reportsPending?: number;
  usersPendingVerification?: number;
  shadowProfilesStale?: number;
  total?: number;
};

const alerts = $derived((alertsQuery.data as unknown as Alerts | undefined) ?? {});
const total = $derived(alerts.total ?? 0);
</script>

{#if total > 0}
	<div class="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
		<div class="mb-3 flex items-center gap-2">
			<AlertTriangle size={14} class="text-amber-500" />
			<h2 class="text-xs font-semibold text-amber-600 dark:text-amber-400">
				Precisando de atenção
			</h2>
		</div>
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
			{#if (alerts.reportsPending ?? 0) > 0}
				<a
					href="/platform/admin/collaboration"
					class="flex items-center justify-between rounded-lg border border-amber-500/20 bg-white/60 px-3 py-2 text-xs transition-colors hover:bg-white dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
				>
					<span class="inline-flex items-center gap-2 text-gray-800 dark:text-neutral-200">
						<Flag size={12} />
						{alerts.reportsPending} report{alerts.reportsPending === 1 ? '' : 's'} pendente{alerts.reportsPending === 1 ? '' : 's'}
					</span>
					<span class="text-gray-400">→</span>
				</a>
			{/if}
			{#if (alerts.usersPendingVerification ?? 0) > 0}
				<a
					href="/platform/admin/users"
					class="flex items-center justify-between rounded-lg border border-amber-500/20 bg-white/60 px-3 py-2 text-xs transition-colors hover:bg-white dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
				>
					<span class="inline-flex items-center gap-2 text-gray-800 dark:text-neutral-200">
						<MailCheck size={12} />
						{alerts.usersPendingVerification} aguardando verificação
					</span>
					<span class="text-gray-400">→</span>
				</a>
			{/if}
			{#if (alerts.shadowProfilesStale ?? 0) > 0}
				<div class="flex items-center justify-between rounded-lg border border-amber-500/20 bg-white/60 px-3 py-2 text-xs dark:bg-neutral-800/50">
					<span class="inline-flex items-center gap-2 text-gray-800 dark:text-neutral-200">
						<UserPlus size={12} />
						{alerts.shadowProfilesStale} shadow profiles antigos
					</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
