<script lang="ts">
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
const doneCount = $derived(steps.length - incomplete.length);
const progressPct = $derived(Math.round((doneCount / Math.max(steps.length, 1)) * 100));
</script>

{#if incomplete.length > 0}
	<Card>
		{#snippet title()}
			<div class="flex items-center gap-3">
				<h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
					{t('dashboard.nextSteps.title')}
				</h2>
				<span class="tabular-nums text-xs font-medium text-gray-500 dark:text-neutral-500">
					{doneCount}/{steps.length}
				</span>
				<div
					class="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800"
					role="progressbar"
					aria-valuenow={progressPct}
					aria-valuemin={0}
					aria-valuemax={100}
				>
					<div
						class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 motion-safe:transition-[width] motion-safe:duration-500"
						style:width="{progressPct}%"
					></div>
				</div>
			</div>
		{/snippet}
		<ul class="-mx-2 divide-y divide-gray-100 dark:divide-neutral-800">
			{#each steps as step (step.id)}
				<li>
					<a
						href={step.href}
						class="group flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60"
					>
						{#if step.done}
							<span class="flex-1 text-gray-400 line-through dark:text-neutral-500">
								{step.label}
							</span>
						{:else}
							<span class="flex-1 text-gray-800 dark:text-neutral-200">{step.label}</span>
							<span
								aria-hidden="true"
								class="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-600 dark:text-neutral-500 dark:group-hover:text-cyan-300"
							>
								→
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</Card>
{/if}
