<script lang="ts">
	import type { ColorSchema } from 'ui';
	import {
		LayoutDashboard,
		Users,
		BarChart3,
		Tags,
		Layers,
		ListChecks,
		Activity,
		Gauge,
		MessageSquare,
		PanelLeftClose,
		PanelLeft,
	} from 'lucide-svelte';

	type Props = {
		currentPath: string;
		colorSchema?: ColorSchema;
	};

	let { currentPath, colorSchema = 'light' }: Props = $props();

	let collapsed = $state(false);

	const cs = $derived(colorSchema);
	const sidebarBg = $derived(cs === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200');
	const text = $derived(cs === 'dark' ? 'text-neutral-400' : 'text-gray-500');
	const activeText = $derived(cs === 'dark' ? 'text-neutral-200' : 'text-gray-800');
	const activeBg = $derived(cs === 'dark' ? 'bg-neutral-800' : 'bg-gray-100');
	const hoverBg = $derived(cs === 'dark' ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50');
	const labelColor = $derived(cs === 'dark' ? 'text-neutral-600' : 'text-gray-300');

	const links = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/admin/skills', label: 'Skills', icon: Tags },
		{ href: '/admin/sections', label: 'Sections', icon: Layers },
		{ href: '/admin/onboarding', label: 'Onboarding', icon: ListChecks },
		{ href: '/admin/health', label: 'Health', icon: Activity },
		{ href: '/admin/performance', label: 'Performance', icon: Gauge },
		{ href: '/admin/chat', label: 'Chat', icon: MessageSquare },
	];

	function isActive(href: string, exact?: boolean): boolean {
		if (exact) return currentPath === href;
		return currentPath.startsWith(href);
	}
</script>

<aside class="flex h-full flex-col border-r transition-all {sidebarBg} {collapsed ? 'w-16' : 'w-60'}">
	<div class="flex items-center justify-between px-4 py-4">
		{#if !collapsed}
			<span class="text-[10px] font-bold uppercase tracking-widest {labelColor}">Admin</span>
		{/if}
		<button
			onclick={() => collapsed = !collapsed}
			class="rounded-lg p-1.5 transition-colors {hoverBg} {text}"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<PanelLeft size={16} />
			{:else}
				<PanelLeftClose size={16} />
			{/if}
		</button>
	</div>

	<nav class="flex-1 space-y-0.5 px-2">
		{#each links as link}
			{@const active = isActive(link.href, link.exact)}
			<a
				href={link.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active ? activeBg + ' ' + activeText : text + ' ' + hoverBg}"
				title={collapsed ? link.label : undefined}
			>
				<svelte:component this={link.icon} size={18} />
				{#if !collapsed}
					<span>{link.label}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>
