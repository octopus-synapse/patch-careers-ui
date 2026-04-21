<script lang="ts">
import { SearchSearchSortBy, searchSearch } from 'api-client';
import {
  Briefcase,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
} from 'lucide-svelte';
import { Avatar } from 'ui';
import { goto } from '$app/navigation';
import { trackCtaClick } from '$lib/analytics/track';

type Props = {
  open: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onclose: () => void;
};

let { open, t, onclose }: Props = $props();

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof User;
  run: () => void;
};

type Section = {
  id: string;
  label: string;
  items: Action[];
};

type PersonResult = {
  userId: string;
  fullName: string | null;
  jobTitle: string | null;
  slug: string | null;
};

const quickActions: Action[] = [
  {
    id: 'new-post',
    label: 'Novo post',
    hint: 'Abrir composer do feed',
    icon: Sparkles,
    run: () => {
      onclose();
      goto('/social/feed?compose=1');
    },
  },
  {
    id: 'edit-profile',
    label: 'Editar perfil',
    icon: User,
    run: () => {
      onclose();
      goto('/my-profile/settings');
    },
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    run: () => {
      onclose();
      goto('/my-profile/settings');
    },
  },
  {
    id: 'logout',
    label: 'Sair',
    icon: LogOut,
    run: () => {
      onclose();
      goto('/identity/sign-out');
    },
  },
];

const navigation: Action[] = [
  { id: 'nav-home', label: 'Dashboard', icon: Home, run: () => { onclose(); goto('/my-profile/dashboard'); } },
  { id: 'nav-feed', label: 'Feed', icon: MessageSquare, run: () => { onclose(); goto('/social/feed'); } },
  { id: 'nav-jobs', label: 'Vagas', icon: Briefcase, run: () => { onclose(); goto('/careers/browse-jobs'); } },
  { id: 'nav-cvs', label: 'Meus CVs', icon: FileText, run: () => { onclose(); goto('/careers/manage-resumes'); } },
  { id: 'nav-network', label: 'Rede', icon: Users, run: () => { onclose(); goto('/social/network'); } },
];

let inputRef: HTMLInputElement | undefined = $state();
let query = $state('');
let people = $state<PersonResult[]>([]);
let searching = $state(false);
let activeIdx = $state(0);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  if (open) {
    query = '';
    people = [];
    activeIdx = 0;
    setTimeout(() => inputRef?.focus(), 0);
  }
});

// Debounced people search — only fires when the user types ≥ 2 chars.
$effect(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    people = [];
    return;
  }
  searching = true;
  debounceTimer = setTimeout(async () => {
    try {
      const res = (await searchSearch({
        q: trimmed,
        skills: '',
        location: '',
        minExp: 0,
        maxExp: 0,
        page: 1,
        limit: 5,
        sortBy: SearchSearchSortBy.relevance,
      })) as unknown as { data?: Record<string, unknown>[] } | undefined;
      const items = res?.data ?? [];
      people = items.map((r) => ({
        userId: String(r.userId ?? ''),
        fullName: (r.fullName as string | null) ?? null,
        jobTitle: (r.jobTitle as string | null) ?? null,
        slug: (r.slug as string | null) ?? null,
      }));
    } catch {
      people = [];
    }
    searching = false;
  }, 250);
});

// Substring match — cheap and good enough until fuse.js lands.
function matches(action: Action, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    action.label.toLowerCase().includes(needle) ||
    (action.hint?.toLowerCase().includes(needle) ?? false)
  );
}

const filteredActions = $derived(quickActions.filter((a) => matches(a, query)));
const filteredNav = $derived(navigation.filter((a) => matches(a, query)));

// Flat list for keyboard nav — order: people → actions → nav.
type FlatEntry =
  | { kind: 'person'; person: PersonResult }
  | { kind: 'action'; action: Action };

const flat = $derived<FlatEntry[]>([
  ...people.map((person) => ({ kind: 'person' as const, person })),
  ...filteredActions.map((action) => ({ kind: 'action' as const, action })),
  ...filteredNav.map((action) => ({ kind: 'action' as const, action })),
]);

$effect(() => {
  if (activeIdx >= flat.length) activeIdx = Math.max(0, flat.length - 1);
});

function runEntry(entry: FlatEntry) {
  if (entry.kind === 'person') {
    if (!entry.person.slug) return;
    onclose();
    trackCtaClick('palette_person', { userId: entry.person.userId });
    goto(`/my-profile/public/@${entry.person.slug}`);
    return;
  }
  trackCtaClick('palette_action', { id: entry.action.id });
  entry.action.run();
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) onclose();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    onclose();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(flat.length - 1, activeIdx + 1);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(0, activeIdx - 1);
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const entry = flat[activeIdx];
    if (entry) runEntry(entry);
    else if (query.trim().length >= 2) {
      onclose();
      goto(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }
}

const sections = $derived<Section[]>(
  [
    {
      id: 'people',
      label: 'Pessoas',
      items: people.map((p) => ({
        id: `person-${p.userId}`,
        label: p.fullName ?? p.slug ?? 'Sem nome',
        hint: p.jobTitle ?? undefined,
        icon: User,
        run: () => {
          if (!p.slug) return;
          onclose();
          goto(`/my-profile/public/@${p.slug}`);
        },
      })),
    },
    { id: 'actions', label: 'Ações rápidas', items: filteredActions },
    { id: 'nav', label: 'Navegação', items: filteredNav },
  ].filter((s) => s.items.length > 0),
);
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-3 pt-[10vh]"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-label="Command palette"
		tabindex="-1"
	>
		<div
			class="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
			role="presentation"
			onkeydown={handleKeydown}
		>
			<div class="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
				<Search size={16} class="text-gray-400" />
				<input
					bind:this={inputRef}
					bind:value={query}
					placeholder={t('search.palettePlaceholder') ?? 'Digite pra buscar ou navegar…'}
					class="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-neutral-200"
				/>
				{#if searching}
					<span class="text-[11px] text-gray-400">…</span>
				{/if}
				<kbd class="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 dark:border-neutral-700 dark:text-neutral-500">Esc</kbd>
			</div>

			<div class="max-h-[50vh] overflow-y-auto py-1">
				{#if sections.length === 0 && query.trim().length > 0}
					<p class="px-4 py-6 text-center text-sm text-gray-500 dark:text-neutral-500">
						Nada encontrado. Pressione Enter pra buscar em todo lugar.
					</p>
				{/if}
				{#each sections as section (section.id)}
					<div class="py-1">
						<p class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600">
							{section.label}
						</p>
						{#each section.items as item (item.id)}
							{@const globalIdx = flat.findIndex((f) =>
								f.kind === 'person'
									? `person-${f.person.userId}` === item.id
									: f.action.id === item.id,
							)}
							{@const active = globalIdx === activeIdx}
							<button
								type="button"
								onmouseenter={() => (activeIdx = globalIdx)}
								onclick={() => runEntry(flat[globalIdx])}
								class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors {active
									? 'bg-cyan-500/10 text-gray-900 dark:text-neutral-100'
									: 'text-gray-700 dark:text-neutral-300'}"
							>
								{#if section.id === 'people'}
									{@const person = people.find((p) => `person-${p.userId}` === item.id)}
									<Avatar name={person?.fullName ?? 'U'} photoURL={null} size="sm" />
								{:else}
									<item.icon size={14} class="text-gray-500 dark:text-neutral-500" />
								{/if}
								<span class="flex-1">{item.label}</span>
								{#if item.hint}
									<span class="text-[11px] text-gray-400 dark:text-neutral-500">{item.hint}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
