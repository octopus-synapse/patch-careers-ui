<script lang="ts">
  /**
   * Profile badges — burra: chama createBadgesUser e renderiza grid.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
import { createBadgesUser } from 'api-client';
import { BadgeIcon, type BadgeKind, Tooltip } from 'ui';
import { browser } from '$app/environment';

type Props = {
  userId: string;
  /** When true, show locked badges as greyed-out with unlock hint. */
  showLocked?: boolean;
};
let { userId, showLocked = false }: Props = $props();

const query = createBadgesUser(
  userId,
  { query: { enabled: browser && Boolean(userId) } },
);

type BadgeRow = { kind: BadgeKind; awardedAt: string };
const earned = $derived(
  (($query.data as { badges?: BadgeRow[] } | undefined)?.badges ?? []) as BadgeRow[],
);

const ALL_BADGES: Array<{ kind: BadgeKind; name: string; hint: string }> = [
  { kind: 'FIRST_BUILD', name: 'Primeira Build', hint: 'Publique seu primeiro post de build.' },
  { kind: 'ATS_90_PLUS', name: 'ATS 90+', hint: 'Atinja ATS score ≥ 90% em um currículo.' },
  { kind: 'MENTORED_10', name: 'Mentor', hint: 'Mentore 10 pessoas.' },
  { kind: 'INTERVIEWS_5', name: 'Em alta', hint: 'Registre 5 entrevistas.' },
  { kind: 'CONTRIBUTOR', name: 'Contribuidor', hint: 'Contribua com a plataforma.' },
  { kind: 'EVENT_SPEAKER', name: 'Palestrante', hint: 'Seja speaker em um evento.' },
];

const earnedSet = $derived(new Set(earned.map((b) => b.kind)));
</script>

{#if showLocked}
	<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
		{#each ALL_BADGES as b (b.kind)}
			{@const unlocked = earnedSet.has(b.kind)}
			<Tooltip text={unlocked ? b.name : `${b.name} — 🔒 ${b.hint}`}>
				<div
					class="flex flex-col items-center gap-1"
					class:opacity-30={!unlocked}
					aria-label={unlocked ? `${b.name} (conquistada)` : `${b.name} (bloqueada): ${b.hint}`}
				>
					<BadgeIcon kind={b.kind} size={32} />
					<span class="text-[10px] text-gray-500 dark:text-neutral-500">{b.name}</span>
				</div>
			</Tooltip>
		{/each}
	</div>
{:else if earned.length > 0}
	<div class="flex items-center gap-1.5">
		{#each earned as badge (badge.kind)}
			<BadgeIcon kind={badge.kind} size={22} />
		{/each}
	</div>
{/if}
