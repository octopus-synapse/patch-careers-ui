<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import { Button } from 'ui';
	import { Check, PanelLeftClose, PanelLeft } from 'lucide-svelte';

	type NavItem = {
		id: string;
		label: string;
		icon?: Component<{ size: number; class?: string }> | string;
		href?: string;
		exact?: boolean;
		completed?: boolean;
		missing?: boolean;
		badge?: Snippet;
	};

	type Props = {
		items: NavItem[];
		active: string;
		title?: string;
		collapsible?: boolean;
		progress?: { value: number; message?: string };
		numbered?: boolean;
		onselect?: (id: string) => void;
	};

	let { items, active, title, collapsible = false, progress, numbered = false, onselect }: Props = $props();

	let collapsed = $state(false);

	const barColor = $derived(
		!progress ? '' :
		progress.value >= 75 ? 'bg-emerald-500' :
		progress.value >= 50 ? 'bg-blue-500' :
		progress.value >= 25 ? 'bg-blue-400' :
		'bg-gray-400 dark:bg-neutral-500'
	);

	function handleClick(item: NavItem) {
		if (onselect) onselect(item.id);
	}

	function isActive(item: NavItem): boolean {
		if (item.href && !item.exact) return active.startsWith(item.href);
		return active === (item.href ?? item.id);
	}
</script>

<aside class="flex flex-col border-r transition-all border-gray-200 dark:border-neutral-800 {collapsible ? (collapsed ? 'w-16' : 'w-52 sm:w-60') : 'w-48 sm:w-56'} {collapsible ? 'h-full bg-white dark:bg-neutral-900' : ''}">
	<!-- Header -->
	<div class="flex items-center justify-between {collapsible ? 'px-4 py-4' : 'mb-6 pr-6'}">
		{#if title && (!collapsible || !collapsed)}
			<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-neutral-500">{title}</span>
		{/if}
		{#if collapsible}
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
		{/if}
	</div>

	<!-- Progress bar -->
	{#if progress}
		<div class="{collapsible ? 'px-4' : 'pr-6'} mb-4">
			<div class="h-1 rounded-full bg-gray-200 dark:bg-neutral-700">
				<div class="h-1 rounded-full transition-all duration-700 {barColor}" style="width: {progress.value}%"></div>
			</div>
			{#if progress.message && (!collapsible || !collapsed)}
				<p class="mt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-500">
					{progress.message}
				</p>
			{/if}
		</div>
	{/if}

	<!-- Nav items -->
	<nav class="flex flex-col gap-0.5 {collapsible ? 'flex-1 px-2' : 'pr-6'}">
		{#each items as item, index}
			{@const itemActive = isActive(item)}

			{#if item.href && !onselect}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors
						{itemActive ? 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-semibold' : 'text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/50'}"
					title={collapsible && collapsed ? item.label : undefined}
				>
					{@render itemContent(item, index, itemActive)}
				</a>
			{:else}
				<button
					onclick={() => handleClick(item)}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs cursor-pointer transition-colors
						{itemActive ? 'bg-white dark:bg-neutral-700/50 font-semibold text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-500 hover:bg-gray-50 dark:hover:bg-neutral-700/50'}"
				>
					{@render itemContent(item, index, itemActive)}
				</button>
			{/if}
		{/each}
	</nav>
</aside>

{#snippet itemContent(item: NavItem, index: number, itemActive: boolean)}
	{#if numbered}
		<!-- Numbered circle (onboarding style) -->
		<div class="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold
			{item.completed ? 'bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-900' :
			 itemActive ? 'text-gray-800 dark:text-neutral-200 border border-gray-300 dark:border-neutral-700' :
			 'text-gray-500 dark:text-neutral-500 border border-gray-300 dark:border-neutral-700'}"
		>
			{#if item.completed}
				<Check size={11} />
			{:else}
				{index + 1}
			{/if}
			{#if item.missing && !item.completed}
				<span class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500"></span>
			{/if}
		</div>
	{:else if typeof item.icon === 'string'}
		<!-- Emoji icon -->
		<span class="text-sm">{item.icon}</span>
	{:else if item.icon}
		<!-- Component icon -->
		{@const Icon = item.icon}
		<Icon size={numbered ? 15 : 18} class={itemActive ? 'text-gray-800 dark:text-neutral-200' : 'text-gray-500 dark:text-neutral-500'} />
	{/if}

	{#if !collapsible || !collapsed}
		<span class={itemActive ? 'text-gray-800 dark:text-neutral-200' : ''}>
			{item.label}
		</span>
	{/if}

	{#if item.badge}
		{@render item.badge()}
	{/if}
{/snippet}
