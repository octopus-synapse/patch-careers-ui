<script lang="ts">
import { useQueryClient } from '@tanstack/svelte-query';
import {
  createGetV1NotificationsPreferences,
  getV1NotificationsPreferencesQueryKey,
  putV1NotificationsPreferencesType,
} from 'api-client';
import { Card, Skeleton, toastState } from 'ui';
import { browser } from '$app/environment';
import { track } from '$lib/utils/analytics/track';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

type PreferenceType =
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'POST_REPOSTED'
  | 'POST_BOOKMARKED'
  | 'COMMENT_REPLIED'
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'FOLLOW_NEW'
  | 'SKILL_DECAY'
  | 'APPLICATION_STALE'
  | 'CONNECTION_RECOMMENDATION';

type EmailDelivery = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'OFF';

type Preference = {
  type: PreferenceType;
  enabled: boolean;
  emailEnabled?: boolean;
  emailDelivery?: EmailDelivery;
};

const t = $derived(locale.t);
const auth = useAuth();
const authenticated = $derived(auth.isAuthenticated);

// svelte-ignore state_referenced_locally
const query = createGetV1NotificationsPreferences({
  query: { enabled: browser && authenticated },
});

const remote = $derived.by<Preference[]>(() => {
  const data = $query.data as Record<string, unknown> | undefined;
  return (data?.preferences as Preference[] | undefined) ?? [];
});

let optimistic = $state<Record<string, boolean>>({});

function effective(p: Preference): boolean {
  return optimistic[p.type] ?? p.enabled;
}

const queryClient = useQueryClient();
let pending = $state<Set<string>>(new Set());

async function toggle(p: Preference) {
  const wasEnabled = effective(p);
  const next = !wasEnabled;
  optimistic = { ...optimistic, [p.type]: next };
  pending = new Set([...pending, p.type]);
  try {
    await putV1NotificationsPreferencesType(p.type, { enabled: next });
    queryClient.invalidateQueries({ queryKey: getV1NotificationsPreferencesQueryKey() });
    track('notification_preference_changed', { type: p.type, enabled: next });
  } catch {
    optimistic = { ...optimistic, [p.type]: wasEnabled };
    toastState.show(t('notifications.preferenceError'), 'danger');
  } finally {
    pending = new Set([...pending].filter((x) => x !== p.type));
  }
}

async function updateEmailMode(p: Preference, mode: EmailDelivery) {
  pending = new Set([...pending, `${p.type}-email`]);
  try {
    await putV1NotificationsPreferencesType(p.type, {
      emailDelivery: mode,
      emailEnabled: mode !== 'OFF',
    });
    queryClient.invalidateQueries({ queryKey: getV1NotificationsPreferencesQueryKey() });
    track('notification_email_mode_changed', { type: p.type, mode });
  } catch {
    toastState.show(t('notifications.preferenceError'), 'danger');
  } finally {
    pending = new Set([...pending].filter((x) => x !== `${p.type}-email`));
  }
}
</script>

<svelte:head>
	<title>{t('notifications.preferencesTitle')}</title>
</svelte:head>

<div>
	<div class="mx-auto max-w-2xl">
		<header class="mb-4">
			<h1 class="text-lg font-semibold text-gray-800 dark:text-neutral-200">
				{t('notifications.preferencesTitle')}
			</h1>
			<p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">
				{t('notifications.preferencesIntro')}
			</p>
		</header>

		<Card>
			{#if $query.isLoading}
				<ul class="divide-y divide-gray-100 dark:divide-neutral-700/40">
					{#each Array(5) as _}
						<li class="flex items-center justify-between py-3">
							<Skeleton shape="text" width="60%" />
							<Skeleton shape="rect" width="2.5rem" height="1.25rem" />
						</li>
					{/each}
				</ul>
			{:else}
				<ul class="divide-y divide-gray-100 dark:divide-neutral-700/40">
					{#each remote as pref (pref.type)}
						{@const enabled = effective(pref)}
						{@const isPending = pending.has(pref.type)}
						{@const emailMode = (pref.emailDelivery ?? 'INSTANT') as EmailDelivery}
						<li class="py-3 first:pt-0 last:pb-0">
							<div class="flex items-center justify-between">
								<span class="pr-4 text-sm text-gray-800 dark:text-neutral-200">
									{t(`notifications.preferenceTypes.${pref.type}`)}
								</span>
								<button
									type="button"
									role="switch"
									aria-checked={enabled}
									aria-label={t(`notifications.preferenceTypes.${pref.type}`)}
									disabled={isPending}
									onclick={() => toggle(pref)}
									class="relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 {enabled
										? 'bg-emerald-500'
										: 'bg-gray-300 dark:bg-neutral-700'}"
								>
									<span
										class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform {enabled
											? 'translate-x-5'
											: 'translate-x-0.5'}"
									></span>
								</button>
							</div>
							{#if enabled}
								<div class="mt-2 flex items-center gap-3 pl-0 sm:pl-4">
									<span class="text-xs text-gray-500 dark:text-neutral-500">Email:</span>
									<select
										value={emailMode}
										onchange={(e) =>
											updateEmailMode(pref, (e.currentTarget as HTMLSelectElement).value as EmailDelivery)}
										disabled={pending.has(`${pref.type}-email`)}
										class="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
										aria-label="Email delivery mode for {pref.type}"
									>
										<option value="INSTANT">Instantâneo</option>
										<option value="DAILY">Resumo diário</option>
										<option value="WEEKLY">Resumo semanal</option>
										<option value="OFF">Desativado</option>
									</select>
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Card>
	</div>
</div>
