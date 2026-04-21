<script lang="ts">
import {
  Activity,
  BarChart3,
  Gauge,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Tags,
  Users,
  Wrench,
} from 'lucide-svelte';
import { Button } from 'ui';
import { locale } from '$lib/state/locale.svelte';

type Props = {
  currentPath: string;
};

let { currentPath }: Props = $props();

let collapsed = $state(false);

const t = $derived(locale.t);

const links = $derived([
  { href: '/platform/admin', label: t('admin.nav.dashboard'), icon: LayoutDashboard, exact: true },
  { href: '/platform/admin/users', label: t('admin.nav.users'), icon: Users },
  { href: '/platform/admin/analytics', label: t('admin.nav.analytics'), icon: BarChart3 },
  { href: '/platform/admin/skills', label: t('admin.nav.skills'), icon: Tags },
  { href: '/platform/admin/sections', label: t('admin.nav.sections'), icon: Layers },
  { href: '/platform/admin/onboarding', label: t('admin.nav.onboarding'), icon: ListChecks },
  { href: '/platform/admin/health', label: t('admin.nav.health'), icon: Activity },
  { href: '/platform/admin/performance', label: t('admin.nav.performance'), icon: Gauge },
  { href: '/platform/admin/chat', label: t('admin.nav.chat'), icon: MessageSquare },
  { href: '/platform/admin/dev-tools', label: t('admin.nav.devTools'), icon: Wrench },
]);

function isActive(href: string, exact?: boolean): boolean {
  if (exact) return currentPath === href;
  return currentPath.startsWith(href);
}
</script>

<aside class="flex h-full flex-col border-r transition-all bg-white border-gray-200 dark:bg-neutral-900 dark:border-neutral-800 {collapsed ? 'w-16' : 'w-60'}">
	<div class="flex items-center justify-between px-4 py-4">
		{#if !collapsed}
			<span class="text-[10px] font-bold uppercase tracking-widest text-gray-300 dark:text-neutral-600">Admin</span>
		{/if}
		<Button
			variant="icon"
			size="sm"
			onclick={() => collapsed = !collapsed}
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<PanelLeft size={16} />
			{:else}
				<PanelLeftClose size={16} />
			{/if}
		</Button>
	</div>

	<nav class="flex-1 space-y-0.5 px-2">
		{#each links as link}
			{@const active = isActive(link.href, link.exact)}
			{@const Icon = link.icon}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active ? 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50'}"
				title={collapsed ? link.label : undefined}
			>
				<Icon size={18} />
				{#if !collapsed}
					<span>{link.label}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>
