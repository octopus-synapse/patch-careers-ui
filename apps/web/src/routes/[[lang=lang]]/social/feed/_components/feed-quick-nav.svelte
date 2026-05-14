<script lang="ts">
import { Bookmark, LayoutGrid, Users } from 'lucide-svelte';
import { page } from '$app/stores';
import { locale } from '$lib/state/locale.svelte';

/**
 * Left sidebar — quick navigation for the feed layout.
 * Three routes only: Explorar (default), Minha Bolha, Salvos.
 */

const t = $derived(locale.t);
const currentPath = $derived($page.url.pathname);

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
};

const items = $derived<NavItem[]>([
  { href: '/social/feed', label: t('feed.nav.explore'), icon: LayoutGrid, exact: true },
  { href: '/social/feed/bubble', label: t('feed.nav.bubble'), icon: Users },
  { href: '/social/feed/bookmarks', label: t('feed.nav.saved'), icon: Bookmark },
]);

function isActive(item: NavItem): boolean {
  if (item.exact) return currentPath === item.href;
  return currentPath.startsWith(item.href);
}
</script>

<aside class="hidden lg:block lg:sticky lg:top-20 lg:self-start">
	<nav>
		<ul class="space-y-1">
			{#each items as item}
				{@const active = isActive(item)}
				{@const Icon = item.icon}
				<li>
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors {active
							? 'bg-black/[0.05] text-gray-900 dark:bg-white/[0.07] dark:text-white'
							: 'text-gray-600 hover:bg-black/[0.03] hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white'}"
					>
						<Icon size={18} strokeWidth={active ? 2.2 : 1.75} />
						<span class="flex-1">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</aside>
