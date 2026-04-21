<!--
  Endorsement management — lists the viewer's skills with current endorsement
  counts, and lets them inspect who endorsed each skill.
-->
<script lang="ts">
import { createSkillEndorsementsGetSkills, skillEndorsementsGetEndorsers } from 'api-client';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-svelte';
import { onMount } from 'svelte';
import { Avatar, toastState } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';

const auth = useAuth();
const viewerId = $derived(String(auth.data?.user?.id ?? ''));

type Skill = { skill: string; endorsementCount: number; endorsedByMe: boolean };
type Endorser = {
  userId: string;
  name: string | null;
  username: string | null;
  photoURL: string | null;
  endorsedAt: string;
};

const skillsQuery = createSkillEndorsementsGetSkills(
  () => viewerId,
  () => ({ query: { enabled: browser && Boolean(viewerId) } }),
);
const skills = $derived.by<Skill[]>(() => {
  const data = skillsQuery.data as Record<string, unknown> | undefined;
  return (data?.skills as Skill[] | undefined) ?? [];
});

let expandedSkill = $state<string | null>(null);
let endorsersCache = $state<Record<string, Endorser[] | 'loading'>>({});

async function toggleExpand(skill: string) {
  if (expandedSkill === skill) {
    expandedSkill = null;
    return;
  }
  expandedSkill = skill;
  if (!endorsersCache[skill]) {
    endorsersCache = { ...endorsersCache, [skill]: 'loading' };
    try {
      const res = (await skillEndorsementsGetEndorsers(viewerId, skill)) as unknown as
        | Record<string, unknown>
        | undefined;
      const list = (res?.data as { endorsers?: Endorser[] } | undefined)?.endorsers ?? [];
      endorsersCache = { ...endorsersCache, [skill]: list };
    } catch {
      toastState.show('Falha ao carregar endossos.', 'danger');
      endorsersCache = { ...endorsersCache, [skill]: [] };
    }
  }
}

onMount(() => {
  // Nothing — queries run on mount automatically.
});
</script>

<svelte:head>
  <title>Endossos · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">
      Meus endossos recebidos
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Veja quem endossou cada skill no seu perfil.
    </p>
  </header>

  {#if skillsQuery.isLoading}
    <div class="flex justify-center py-12">
      <Loader2 size={20} class="animate-spin text-gray-500" />
    </div>
  {:else if skills.length === 0}
    <p
      class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500"
    >
      Nenhuma skill com endossos ainda.
    </p>
  {:else}
    <ul class="space-y-2">
      {#each skills as s (s.skill)}
        {@const endorsers = endorsersCache[s.skill]}
        <li class="rounded-lg border border-gray-200 dark:border-neutral-800">
          <button
            type="button"
            class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
            onclick={() => toggleExpand(s.skill)}
            aria-expanded={expandedSkill === s.skill}
          >
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-neutral-100">{s.skill}</span>
              <span class="ml-2 text-xs text-gray-500 dark:text-neutral-500">
                {s.endorsementCount} endosso{s.endorsementCount === 1 ? '' : 's'}
              </span>
            </div>
            {#if expandedSkill === s.skill}
              <ChevronUp size={16} class="text-gray-400" />
            {:else}
              <ChevronDown size={16} class="text-gray-400" />
            {/if}
          </button>
          {#if expandedSkill === s.skill}
            <div class="border-t border-gray-200 px-4 py-3 dark:border-neutral-800">
              {#if endorsers === 'loading' || endorsers === undefined}
                <div class="flex justify-center py-4">
                  <Loader2 size={14} class="animate-spin text-gray-500" />
                </div>
              {:else if endorsers.length === 0}
                <p class="text-xs text-gray-500 dark:text-neutral-500">
                  Ninguém endossou essa skill ainda.
                </p>
              {:else}
                <ul class="space-y-2">
                  {#each endorsers as e (e.userId)}
                    <li class="flex items-center gap-3">
                      <Avatar
                        name={e.name ?? e.username ?? '?'}
                        photoURL={e.photoURL}
                        size="sm"
                      />
                      <div class="flex-1">
                        <a
                          href="/@{e.username}"
                          class="text-sm text-gray-800 hover:underline dark:text-neutral-200"
                        >
                          {e.name ?? e.username ?? 'Usuário'}
                        </a>
                        <p class="text-[11px] text-gray-500 dark:text-neutral-500">
                          {new Date(e.endorsedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
