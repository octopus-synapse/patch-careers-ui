<script lang="ts">
  /**
   * Skills section — burra: lista skills + endorsements + popover de endorsers.
   * Backend retorna `void` no schema OpenAPI; cast local da resposta.
   */
  import { useQueryClient } from '@tanstack/svelte-query';
  import {
    createSkillEndorsementsUsersSkills,
    skillEndorsementsUsersSkillsQueryKey,
    skillEndorsementsUsersSkillsEndorseDelete,
    skillEndorsementsUsersSkillsEndorsePost,
    skillEndorsementsUsersSkillsEndorsers,
  } from 'api-client';
  import { Check, Plus } from 'lucide-svelte';
  import { Avatar, Card, Skeleton, toastState } from 'ui';
  import { browser } from '$app/environment';
  import { locale } from '$lib/state/locale.svelte';

  type Props = {
    userId: string;
    isOwnProfile: boolean;
    viewerAuthenticated: boolean;
  };

  let { userId, isOwnProfile, viewerAuthenticated }: Props = $props();

  type SkillSummary = {
    skill: string;
    endorsementCount: number;
    endorsedByMe: boolean;
  };

  type Endorser = {
    id: string;
    name: string | null;
    username: string | null;
    photoURL: string | null;
    endorsedAt: string;
  };

  const t = $derived(locale.t);
  const queryClient = useQueryClient();

  const query = createSkillEndorsementsUsersSkills(
    userId,
    { query: { enabled: browser && !!userId } },
  );

  const skills = $derived(
    (($query.data as unknown as { skills?: SkillSummary[] } | undefined)?.skills ?? []) as SkillSummary[],
  );

  let optimisticOverrides = $state<Record<string, { endorsedByMe: boolean; delta: number }>>({});

  function effectiveSkill(s: SkillSummary): SkillSummary {
    const o = optimisticOverrides[s.skill];
    if (!o) return s;
    return {
      skill: s.skill,
      endorsementCount: s.endorsementCount + o.delta,
      endorsedByMe: o.endorsedByMe,
    };
  }

  async function toggleEndorse(s: SkillSummary) {
    if (isOwnProfile || !viewerAuthenticated) return;
    const current = effectiveSkill(s);
    const skillEnc = encodeURIComponent(s.skill);
    if (current.endorsedByMe) {
      optimisticOverrides = {
        ...optimisticOverrides,
        [s.skill]: { endorsedByMe: false, delta: (optimisticOverrides[s.skill]?.delta ?? 0) - 1 },
      };
      try {
        await skillEndorsementsUsersSkillsEndorseDelete(userId, skillEnc);
        await queryClient.invalidateQueries({
          queryKey: skillEndorsementsUsersSkillsQueryKey(userId),
        });
      } catch {
        const next = { ...optimisticOverrides };
        delete next[s.skill];
        optimisticOverrides = next;
        toastState.show(t('network.endorseRemoveError'), 'danger');
      }
    } else {
      optimisticOverrides = {
        ...optimisticOverrides,
        [s.skill]: { endorsedByMe: true, delta: (optimisticOverrides[s.skill]?.delta ?? 0) + 1 },
      };
      try {
        await skillEndorsementsUsersSkillsEndorsePost(userId, skillEnc);
        await queryClient.invalidateQueries({
          queryKey: skillEndorsementsUsersSkillsQueryKey(userId),
        });
      } catch {
        const next = { ...optimisticOverrides };
        delete next[s.skill];
        optimisticOverrides = next;
        toastState.show(t('network.endorseError'), 'danger');
      }
    }
  }

  let hoveredSkill = $state<string | null>(null);
  let endorserCache = $state<Record<string, Endorser[]>>({});
  let loadingEndorsers = $state<Record<string, boolean>>({});

  async function loadEndorsers(skill: string) {
    if (endorserCache[skill] || loadingEndorsers[skill]) return;
    loadingEndorsers = { ...loadingEndorsers, [skill]: true };
    try {
      const res = (await skillEndorsementsUsersSkillsEndorsers(
        userId,
        encodeURIComponent(skill),
        { page: '1', limit: '8' },
      )) as unknown as { items?: Endorser[] } | undefined;
      const data = res?.items ?? [];
      endorserCache = { ...endorserCache, [skill]: data };
    } finally {
      loadingEndorsers = { ...loadingEndorsers, [skill]: false };
    }
  }

  function handleHover(skill: string) {
    hoveredSkill = skill;
    void loadEndorsers(skill);
  }
</script>

<Card>
  {#snippet title()}
    <h2 class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
      {t('network.skillsTitle')}
    </h2>
  {/snippet}

  {#if $query.isLoading}
    <div class="flex flex-wrap gap-2">
      {#each Array(6) as _}
        <Skeleton shape="rect" width="5rem" height="1.75rem" />
      {/each}
    </div>
  {:else if skills.length === 0}
    <p class="text-xs text-gray-500 dark:text-neutral-500">{t('network.skillsEmpty')}</p>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each skills as s (s.skill)}
        {@const eff = effectiveSkill(s)}
        <div
          class="relative"
          onmouseenter={() => handleHover(s.skill)}
          onmouseleave={() => (hoveredSkill = null)}
          role="presentation"
        >
          <button
            type="button"
            disabled={isOwnProfile || !viewerAuthenticated}
            onclick={() => toggleEndorse(s)}
            class="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors {eff.endorsedByMe
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300'} {isOwnProfile ||
            !viewerAuthenticated
              ? 'cursor-default'
              : 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20'}"
          >
            <span>{s.skill}</span>
            {#if eff.endorsementCount > 0}
              <span class="tabular-nums text-[10px] opacity-75">{eff.endorsementCount}</span>
            {/if}
            {#if !isOwnProfile && viewerAuthenticated}
              {#if eff.endorsedByMe}
                <Check size={10} />
              {:else}
                <Plus size={10} class="opacity-0 transition-opacity group-hover:opacity-100" />
              {/if}
            {/if}
          </button>

          {#if hoveredSkill === s.skill && eff.endorsementCount > 0}
            <div
              class="absolute left-0 top-full z-30 mt-2 w-60 rounded-lg border bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
            >
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                {t('network.endorsersTitle')}
              </p>
              {#if loadingEndorsers[s.skill]}
                <div class="space-y-1.5">
                  {#each Array(3) as _}
                    <div class="flex items-center gap-2">
                      <Skeleton shape="avatar" width="1.5rem" height="1.5rem" />
                      <Skeleton shape="text" width="60%" />
                    </div>
                  {/each}
                </div>
              {:else if endorserCache[s.skill]?.length}
                <ul class="space-y-1.5">
                  {#each endorserCache[s.skill] as endorser (endorser.id)}
                    <li class="flex items-center gap-2">
                      <Avatar
                        name={endorser.name ?? endorser.username ?? '?'}
                        photoURL={endorser.photoURL}
                        size="sm"
                      />
                      <a
                        href="/my-profile/public/@{endorser.username ?? ''}"
                        class="truncate text-xs text-gray-800 hover:underline dark:text-neutral-200"
                      >
                        {endorser.name ?? endorser.username ?? '—'}
                      </a>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-xs text-gray-500 dark:text-neutral-500">—</p>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</Card>
