<script lang="ts">
import { CheckCircle2, UserCheck } from 'lucide-svelte';
import { Button, Card } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  user: Record<string, unknown> | undefined;
};

let { user }: Props = $props();

const t = $derived(locale.t);

/** Derive a naive completion score from well-known profile fields on the session user.
 *  When the backend adds a real endpoint this component can be swapped for that. */
const percent = $derived.by(() => {
  if (!user) return 0;
  const fields: Array<[string, unknown]> = [
    ['name', user.name],
    ['email', user.email],
    ['username', (user as Record<string, unknown>).username],
    ['photoURL', (user as Record<string, unknown>).photoURL],
    ['headline', (user as Record<string, unknown>).headline],
    ['location', (user as Record<string, unknown>).location],
    ['bio', (user as Record<string, unknown>).bio],
    ['hasCompletedOnboarding', (user as Record<string, unknown>).hasCompletedOnboarding],
  ];
  const filled = fields.filter(([, v]) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    return Boolean(v);
  }).length;
  return Math.round((filled / fields.length) * 100);
});

const isComplete = $derived(percent >= 100);
</script>

<Card>
	{#snippet title()}
		<div class="flex items-center gap-2">
			{#if isComplete}
				<CheckCircle2 size={16} class="text-emerald-500" />
			{:else}
				<UserCheck size={16} class="text-gray-500 dark:text-neutral-400" />
			{/if}
			<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
				{t('dashboard.profileCompletion')}
			</h2>
			<span class="ml-auto tabular-nums text-xs font-semibold text-gray-600 dark:text-neutral-400">
				{percent}%
			</span>
		</div>
	{/snippet}

	<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-700/60">
		<div
			class="h-full rounded-full transition-all duration-500 {isComplete
				? 'bg-emerald-500'
				: 'bg-gradient-to-r from-sky-400 to-blue-500'}"
			style:width="{percent}%"
		></div>
	</div>

	<div class="mt-3 flex items-center justify-between">
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{isComplete ? t('dashboard.profileComplete') : t('dashboard.profileCompletionCta')}
		</p>
		{#if !isComplete}
			<Button variant="ghost" size="xs" onclick={() => goto('/settings')}>
				{t('dashboard.profileCompletionCta')}
			</Button>
		{/if}
	</div>
</Card>
