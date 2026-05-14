<script lang="ts">
import { getV1SearchGlobal } from 'api-client';
import type { GetV1SearchGlobal200 } from 'api-client';
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
import { goto } from '$app/navigation';
import { trackCtaClick } from '$lib/utils/analytics/track';

/**
 * Global command palette — frontend BURRO renderer for the backend's
 * `/api/v1/search/global` endpoint (T11.13). Backend ships the canonical
 * `{groups:[{type,label,items:[{id,title,snippet?,href,badge?}]}]}` shape.
 *
 * The page's static "quick actions" + "navigation" lists stay client-owned
 * because they're pure routing — no domain decision is made here.
 */
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

type GlobalSearchGroup = GetV1SearchGlobal200['groups'][number];
type GlobalSearchItem = GlobalSearchGroup['items'][number];

const quickActions: Action[] = $derived([
  {
    id: 'new-post',
    label: t('commandPalette.actions.newPost'),
    hint: 'Abrir composer do feed',
    icon: Sparkles,
    run: () => {
      onclose();
      goto('/social/feed?compose=1');
    },
  },
  {
    id: 'edit-profile',
    label: t('commandPalette.actions.editProfile'),
    icon: User,
    run: () => {
      onclose();
      goto('/my-profile/settings');
    },
  },
  {
    id: 'settings',
    label: t('commandPalette.actions.settings'),
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
]);

const navigation: Action[] = $derived([
  { id: 'nav-home', label: 'Dashboard', icon: Home, run: () => { onclose(); goto('/my-profile/dashboard'); } },
  { id: 'nav-feed', label: 'Feed', icon: MessageSquare, run: () => { onclose(); goto('/social/feed'); } },
  { id: 'nav-jobs', label: 'Vagas', icon: Briefcase, run: () => { onclose(); goto('/careers/browse-jobs'); } },
  { id: 'nav-cvs', label: t('commandPalette.actions.myResumes'), icon: FileText, run: () => { onclose(); goto('/careers/manage-resumes'); } },
  { id: 'nav-network', label: 'Rede', icon: Users, run: () => { onclose(); goto('/social/network'); } },
]);

let inputRef: HTMLInputElement | undefined = $state();
let query = $state('');
let groups = $state<GlobalSearchGroup[]>([]);
let searching = $state(false);
let activeIdx = $state(0);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

$effect(() => {
  if (open) {
    query = '';
    groups = [];
    activeIdx = 0;
    setTimeout(() => inputRef?.focus(), 0);
  }
});

// Debounced backend search — only fires when the user types ≥ 2 chars.
$effect(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    groups = [];
    return;
  }
  searching = true;
  debounceTimer = setTimeout(async () => {
    try {
      const res = await getV1SearchGlobal({ q: trimmed, limit: 20 });
      groups = res.groups;
    } catch {
      groups = [];
    }
    searching = false;
  }, 200);
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

// Flat list for keyboard nav — order: backend hits → quick actions → nav.
type FlatEntry =
  | { kind: 'item'; groupType: string; item: GlobalSearchItem }
  | { kind: 'action'; action: Action };

const flat = $derived<FlatEntry[]>([
  ...groups.flatMap((g) =>
    g.items.map((item) => ({ kind: 'item' as const, groupType: g.type, item })),
  ),
  ...filteredActions.map((action) => ({ kind: 'action' as const, action })),
  ...filteredNav.map((action) => ({ kind: 'action' as const, action })),
]);

$effect(() => {
  if (activeIdx >= flat.length) activeIdx = Math.max(0, flat.length - 1);
});

function runEntry(entry: FlatEntry) {
  if (entry.kind === 'item') {
    onclose();
    trackCtaClick('palette_item', { id: entry.item.id, type: entry.groupType });
    goto(entry.item.href);
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

// flat-index lookup helpers for hover/click ↔ keyboard sync.
function indexOfItem(groupType: string, itemId: string): number {
  return flat.findIndex(
    (f) => f.kind === 'item' && f.groupType === groupType && f.item.id === itemId,
  );
}

function indexOfAction(actionId: string): number {
  return flat.findIndex((f) => f.kind === 'action' && f.action.id === actionId);
}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-3 pt-[10vh]"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		aria-label={t('commandPalette.ariaLabel')}
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
				{#if groups.length === 0 && filteredActions.length === 0 && filteredNav.length === 0 && query.trim().length > 0}
					<p class="px-4 py-6 text-center text-sm text-gray-500 dark:text-neutral-500">
						Nada encontrado. Pressione Enter pra buscar em todo lugar.
					</p>
				{/if}

				<!-- Backend-driven groups (people, posts, jobs, etc) -->
				{#each groups as group (group.type)}
					{#if group.items.length > 0}
						<div class="py-1">
							<p class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600">
								{group.label}
							</p>
							{#each group.items as item (item.id)}
								{@const idx = indexOfItem(group.type, item.id)}
								{@const active = idx === activeIdx}
								<button
									type="button"
									onmouseenter={() => (activeIdx = idx)}
									onclick={() => runEntry({ kind: 'item', groupType: group.type, item })}
									class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors {active
										? 'bg-cyan-500/10 text-gray-900 dark:text-neutral-100'
										: 'text-gray-700 dark:text-neutral-300'}"
								>
									<Search size={14} class="text-gray-500 dark:text-neutral-500" />
									<span class="flex-1 truncate">{item.title}</span>
									{#if item.badge}
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-neutral-700 dark:text-neutral-300">{item.badge}</span>
									{/if}
									{#if item.snippet}
										<span class="text-[11px] text-gray-400 dark:text-neutral-500">{item.snippet}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				{/each}

				<!-- Static quick actions -->
				{#if filteredActions.length > 0}
					<div class="py-1">
						<p class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600">
							Ações rápidas
						</p>
						{#each filteredActions as action (action.id)}
							{@const idx = indexOfAction(action.id)}
							{@const active = idx === activeIdx}
							<button
								type="button"
								onmouseenter={() => (activeIdx = idx)}
								onclick={() => runEntry({ kind: 'action', action })}
								class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors {active
									? 'bg-cyan-500/10 text-gray-900 dark:text-neutral-100'
									: 'text-gray-700 dark:text-neutral-300'}"
							>
								<action.icon size={14} class="text-gray-500 dark:text-neutral-500" />
								<span class="flex-1">{action.label}</span>
								{#if action.hint}
									<span class="text-[11px] text-gray-400 dark:text-neutral-500">{action.hint}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<!-- Navigation -->
				{#if filteredNav.length > 0}
					<div class="py-1">
						<p class="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-600">
							Navegação
						</p>
						{#each filteredNav as action (action.id)}
							{@const idx = indexOfAction(action.id)}
							{@const active = idx === activeIdx}
							<button
								type="button"
								onmouseenter={() => (activeIdx = idx)}
								onclick={() => runEntry({ kind: 'action', action })}
								class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors {active
									? 'bg-cyan-500/10 text-gray-900 dark:text-neutral-100'
									: 'text-gray-700 dark:text-neutral-300'}"
							>
								<action.icon size={14} class="text-gray-500 dark:text-neutral-500" />
								<span class="flex-1">{action.label}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
