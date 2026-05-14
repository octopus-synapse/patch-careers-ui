<!--
  Global activity timeline — aggregated feed of activity from everyone the
  current user follows (plus their own). Uses createActivityGetFeed.
-->
<script lang="ts">
import { createGetV1UsersUserIdActivities, type GetV1UsersUserIdActivities200 } from 'api-client';
import { Award, FileText, Palette, Sparkles, UserPlus } from 'lucide-svelte';
import { Avatar, Loader } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const auth = useAuth();
const viewerId = $derived(String(auth.userId ?? ''));

type ActivityItem = GetV1UsersUserIdActivities200['items'][number];

const feed = createGetV1UsersUserIdActivities(() => viewerId,
  {},
  { query: { enabled: () => browser && viewerId !== ''} },
);

const activities = $derived($feed.data?.items);

function iconFor(type: ActivityItem['type']) {
  if (type.startsWith('RESUME')) return FileText;
  if (type === 'FOLLOWED_USER' || type === 'CONNECTED_USER') return UserPlus;
  if (type === 'ACHIEVEMENT_EARNED') return Award;
  if (type === 'THEME_PUBLISHED') return Palette;
  return Sparkles;
}

function summarize(a: ActivityItem): string {
  const name = a.user?.name ?? a.user?.username ?? 'Alguém';
  switch (a.type) {
    case 'RESUME_CREATED':
      return `${name} criou um novo currículo.`;
    case 'RESUME_UPDATED':
      return `${name} atualizou o currículo.`;
    case 'RESUME_PUBLISHED':
      return `${name} publicou o currículo.`;
    case 'RESUME_SHARED':
      return `${name} compartilhou um currículo.`;
    case 'THEME_PUBLISHED':
      return `${name} publicou um tema.`;
    case 'ACHIEVEMENT_EARNED':
      return `${name} conquistou uma achievement.`;
    case 'SKILL_ADDED':
      return `${name} adicionou uma nova skill.`;
    case 'PROFILE_UPDATED':
      return `${name} atualizou o perfil.`;
    case 'FOLLOWED_USER':
      return `${name} começou a seguir alguém.`;
    case 'CONNECTED_USER':
      return `${name} conectou com alguém novo.`;
  }
}
</script>

<svelte:head>
  <title>Timeline · Patch Careers</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 pt-20 pb-12">
  <header class="mb-6">
    <h1 class="text-xl font-semibold text-gray-900 dark:text-neutral-100">Timeline</h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-neutral-500">
      Atividade de quem você segue + suas próprias ações.
    </p>
  </header>

  {#if $feed.isLoading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if !activities || activities.length === 0}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Nada por aqui ainda. Siga perfis para popular sua timeline.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each activities as a (a.id)}
        {@const Icon = iconFor(a.type)}
        <li class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
          <Avatar
            name={a.user?.name ?? a.user?.username ?? '?'}
            photoURL={a.user?.photoURL}
            size="sm"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <Icon size={14} class="text-gray-400" />
              <p class="text-sm text-gray-800 dark:text-neutral-200">{summarize(a)}</p>
            </div>
            <p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-600">
              {new Date(a.createdAt).toLocaleString()}
            </p>
          </div>
          {#if a.user?.username}
            <a
              href="/my-profile/public/@{a.user.username}"
              class="text-xs text-cyan-500 hover:underline"
              aria-label={t('feed.activity.viewProfileAria')}
            >
              ver
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
