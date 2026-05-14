<script lang="ts">
  /**
   * Profile badges — burra: chama createGetV1BadgesUserUserId e renderiza grid.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
import { createGetV1BadgesUserUserId } from 'api-client';
import { BadgeIcon, type BadgeKind, Tooltip } from 'ui';
import { browser } from '$app/environment';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

type Props = {
  userId: string;
  /** When true, show locked badges as greyed-out with unlock hint. */
  showLocked?: boolean;
};
let { userId, showLocked = false }: Props = $props();

const query = createGetV1BadgesUserUserId(() => userId,
  { query: { enabled: () => browser && Boolean(userId)} },
);

type BadgeRow = { kind: BadgeKind; awardedAt: string };
const earned = $derived(
  (($query.data as { badges?: BadgeRow[] } | undefined)?.badges ?? []) as BadgeRow[],
);

const BADGE_LABEL_KEYS: Record<BadgeKind, string> = {
  FIRST_BUILD: 'ui.badgeIcon.firstBuild',
  ATS_90_PLUS: 'ui.badgeIcon.ats90Plus',
  MENTORED_10: 'ui.badgeIcon.mentored10',
  INTERVIEWS_5: 'ui.badgeIcon.interviews5',
  CONTRIBUTOR: 'ui.badgeIcon.contributor',
  EVENT_SPEAKER: 'ui.badgeIcon.eventSpeaker',
};
const BADGE_HINT_KEYS: Record<BadgeKind, string> = {
  FIRST_BUILD: 'myProfile.public.badgeHint.firstBuild',
  ATS_90_PLUS: 'myProfile.public.badgeHint.ats90Plus',
  MENTORED_10: 'myProfile.public.badgeHint.mentored10',
  INTERVIEWS_5: 'myProfile.public.badgeHint.interviews5',
  CONTRIBUTOR: 'myProfile.public.badgeHint.contributor',
  EVENT_SPEAKER: 'myProfile.public.badgeHint.eventSpeaker',
};

const ALL_KINDS: BadgeKind[] = [
  'FIRST_BUILD',
  'ATS_90_PLUS',
  'MENTORED_10',
  'INTERVIEWS_5',
  'CONTRIBUTOR',
  'EVENT_SPEAKER',
];

const earnedSet = $derived(new Set(earned.map((b) => b.kind)));
</script>

{#if showLocked}
	<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
		{#each ALL_KINDS as kind (kind)}
			{@const unlocked = earnedSet.has(kind)}
			{@const name = t(BADGE_LABEL_KEYS[kind])}
			{@const hint = t(BADGE_HINT_KEYS[kind])}
			<Tooltip text={unlocked ? name : t('myProfile.public.badgeLocked', { name, hint })}>
				<div
					class="flex flex-col items-center gap-1"
					class:opacity-30={!unlocked}
					aria-label={unlocked
						? t('myProfile.public.badgeEarned', { name })
						: t('myProfile.public.badgeLockedAria', { name, hint })}
				>
					<BadgeIcon {kind} size={32} label={name} />
					<span class="text-[10px] text-gray-500 dark:text-neutral-500">{name}</span>
				</div>
			</Tooltip>
		{/each}
	</div>
{:else if earned.length > 0}
	<div class="flex items-center gap-1.5">
		{#each earned as badge (badge.kind)}
			<BadgeIcon kind={badge.kind} size={22} label={t(BADGE_LABEL_KEYS[badge.kind])} />
		{/each}
	</div>
{/if}
