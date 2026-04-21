<script lang="ts">
import { Check, ChevronRight, Circle, Sparkles } from 'lucide-svelte';
import { Card } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type DashboardUser = {
  photoURL?: string | null;
  hasCompletedOnboarding?: boolean;
  profileCompletionPercent?: number;
};

type Signals = {
  pendingInvitationsTotal?: number;
  applicationsCount?: number;
  resumeSectionsCount?: number;
};

type Props = {
  user: DashboardUser;
  signals: Signals;
};

let { user, signals }: Props = $props();

const t = $derived(locale.t);

type Step = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

const steps = $derived.by<Step[]>(() => {
  const pct = user.profileCompletionPercent ?? 0;
  return [
    {
      id: 'photo',
      label: t('dashboard.nextSteps.photo'),
      done: Boolean(user.photoURL),
      href: '/my-profile/settings',
    },
    {
      id: 'experience',
      label: t('dashboard.nextSteps.experience'),
      done: (signals.resumeSectionsCount ?? 0) >= 2,
      href: '/careers/manage-resumes',
    },
    {
      id: 'invites',
      label: t('dashboard.nextSteps.invites'),
      done: (signals.pendingInvitationsTotal ?? 0) === 0,
      href: '/social/network/invitation-manager/received',
    },
    {
      id: 'apply',
      label: t('dashboard.nextSteps.apply'),
      done: (signals.applicationsCount ?? 0) > 0,
      href: '/careers/browse-jobs',
    },
    {
      id: 'complete',
      label: t('dashboard.nextSteps.complete', { percent: pct }),
      done: pct >= 80,
      href: '/my-profile/settings',
    },
  ];
});

const incomplete = $derived(steps.filter((s) => !s.done));
</script>

{#if incomplete.length > 0}
	<Card>
		{#snippet title()}
			<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
				<Sparkles size={16} class="text-emerald-500" />
				{t('dashboard.nextSteps.title')}
				<span class="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
					{incomplete.length}
				</span>
			</h2>
		{/snippet}
		<ul class="divide-y divide-gray-100 dark:divide-neutral-800">
			{#each steps as step (step.id)}
				<li>
					<a
						href={step.href}
						class="flex items-center gap-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
					>
						{#if step.done}
							<Check size={16} class="shrink-0 text-emerald-500" />
							<span class="flex-1 text-gray-400 line-through dark:text-neutral-500">{step.label}</span>
						{:else}
							<Circle size={16} class="shrink-0 text-gray-400 dark:text-neutral-500" />
							<span class="flex-1 text-gray-800 dark:text-neutral-200">{step.label}</span>
							<ChevronRight size={14} class="shrink-0 text-gray-400 dark:text-neutral-500" />
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</Card>
{/if}
