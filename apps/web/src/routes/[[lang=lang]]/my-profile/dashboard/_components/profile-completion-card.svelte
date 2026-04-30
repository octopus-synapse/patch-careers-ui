<script lang="ts">
import { Button, Card } from 'ui';
import { goto } from '$app/navigation';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  user: Record<string, unknown> | undefined;
};

let { user }: Props = $props();

const t = $derived(locale.t);

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

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const dashOffset = $derived(CIRCUMFERENCE * (1 - percent / 100));
</script>

<Card>
	{#snippet title()}
		<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
			{t('dashboard.profileCompletion')}
		</h2>
	{/snippet}

	<div class="flex items-center gap-4">
		<div class="relative shrink-0">
			<svg
				width="72"
				height="72"
				viewBox="0 0 72 72"
				class="-rotate-90 motion-safe:transition-transform"
				aria-hidden="true"
			>
				<circle
					cx="36"
					cy="36"
					r={RADIUS}
					fill="none"
					stroke-width="6"
					class="stroke-gray-100 dark:stroke-neutral-800"
				/>
				<circle
					cx="36"
					cy="36"
					r={RADIUS}
					fill="none"
					stroke-width="6"
					stroke-linecap="round"
					stroke-dasharray={CIRCUMFERENCE}
					stroke-dashoffset={dashOffset}
					class="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 stroke-cyan-500 dark:stroke-cyan-400"
				/>
			</svg>
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="text-sm font-semibold tabular-nums text-gray-900 dark:text-neutral-100">
					{percent}<span class="text-[10px] font-medium text-gray-500 dark:text-neutral-500">%</span>
				</span>
			</div>
		</div>

		<div class="min-w-0 flex-1">
			<p class="text-sm font-medium text-gray-800 dark:text-neutral-200">
				{isComplete ? t('dashboard.profileComplete') : t('dashboard.profileCompletionCta')}
			</p>
			{#if !isComplete}
				<div class="mt-2">
					<Button variant="ghost" size="xs" onclick={() => goto('/my-profile/settings')}>
						{t('dashboard.profileCompletionCta')}
					</Button>
				</div>
			{/if}
		</div>
	</div>
</Card>
