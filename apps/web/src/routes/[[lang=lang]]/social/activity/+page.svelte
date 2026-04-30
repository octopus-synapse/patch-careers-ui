<!--
  Global activity timeline — aggregated feed of activity from everyone the
  current user follows (plus their own). Uses createActivityGetFeed.
-->
<script lang="ts">
import { createSocialActivityUsersFeed } from 'api-client';
import { AlarmClock, Award, Briefcase, FileText, Sparkles, TrendingDown, UserPlus, Users } from 'lucide-svelte';
import { Avatar, Loader } from 'ui';
import { browser } from '$app/environment';
import { useAuth } from '$lib/state/auth.svelte';

const auth = useAuth();
const viewerId = $derived(String(auth.data?.user?.id ?? ''));

interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    photoURL: string | null;
  };
}

// Swagger declares the response as `void`; runtime ships
// `{items?:[...], activities?:[...]}` (envelope key not yet finalized).
type ActivityFeedResponse = {
  items?: ActivityItem[];
  activities?: ActivityItem[];
  feed?: { data?: ActivityItem[] };
};

const feed = createSocialActivityUsersFeed(
  () => viewerId,
  () => ({}),
  () => ({ query: { enabled: browser && Boolean(viewerId) } }),
);

const activities = $derived.by<ActivityItem[]>(() => {
  const raw = feed.data as unknown as ActivityFeedResponse | undefined;
  return raw?.items ?? raw?.activities ?? raw?.feed?.data ?? [];
});

function iconFor(type: string) {
  if (type === 'SKILL_DECAY') return TrendingDown;
  if (type === 'APPLICATION_STALE') return AlarmClock;
  if (type === 'CONNECTION_RECOMMENDATION') return Users;
  if (type.startsWith('RESUME')) return FileText;
  if (type === 'FOLLOW_NEW' || type === 'CONNECTION_ACCEPTED') return UserPlus;
  if (type.startsWith('JOB') || type.startsWith('APPLICATION')) return Briefcase;
  if (type.startsWith('BADGE')) return Award;
  return Sparkles;
}

function summarize(a: ActivityItem): string {
  const name = a.user.name ?? a.user.username ?? 'Alguém';
  switch (a.type) {
    case 'RESUME_CREATED':
      return `${name} criou um novo currículo.`;
    case 'RESUME_UPDATED':
      return `${name} atualizou o currículo.`;
    case 'RESUME_PUBLISHED':
      return `${name} publicou o currículo.`;
    case 'FOLLOW_NEW':
      return `${name} começou a seguir alguém.`;
    case 'CONNECTION_ACCEPTED':
      return `${name} conectou com alguém novo.`;
    case 'JOB_APPLIED':
      return `${name} aplicou para uma vaga.`;
    case 'BADGE_EARNED':
      return `${name} conquistou uma badge.`;
    case 'SKILL_DECAY':
      return `Sua skill "${(a.metadata?.skillName as string) ?? '...'}" não recebeu atualizações há ${(a.metadata?.daysSinceTouched as number) ?? 'vários'} dias — vale reativar.`;
    case 'APPLICATION_STALE':
      return `Aplicação para ${(a.metadata?.company as string) ?? 'uma vaga'} parada há ${(a.metadata?.daysSilent as number) ?? 'vários'} dias. Que tal um follow-up?`;
    case 'CONNECTION_RECOMMENDATION':
      return `Sugestão: você tem ${(a.metadata?.sharedSkills as number) ?? 'várias'} skills em comum com ${(a.metadata?.suggestedName as string) ?? 'alguém'}.`;
    default:
      return `${name} — ${a.type.toLowerCase().replace(/_/g, ' ')}`;
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

  {#if feed.isLoading}
    <div class="flex justify-center py-12">
      <Loader size={20} />
    </div>
  {:else if activities.length === 0}
    <p class="rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
      Nada por aqui ainda. Siga perfis para popular sua timeline.
    </p>
  {:else}
    <ul class="space-y-3">
      {#each activities as a (a.id)}
        {@const Icon = iconFor(a.type)}
        <li class="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-neutral-800">
          <Avatar
            name={a.user.name ?? a.user.username ?? '?'}
            photoURL={a.user.photoURL}
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
          {#if a.user.username}
            <a
              href="/my-profile/public/@{a.user.username}"
              class="text-xs text-cyan-500 hover:underline"
              aria-label="Ver perfil"
            >
              ver
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
