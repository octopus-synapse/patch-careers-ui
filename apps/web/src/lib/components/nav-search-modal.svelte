<script lang="ts">
	import { Search, FileText, Building2, Briefcase, ArrowRight, Hash } from 'lucide-svelte';

	type Props = {
		open: boolean;
		cs: 'light' | 'dark';
		t: (key: string) => string;
		onclose: () => void;
	};

	let { open, cs, t, onclose }: Props = $props();

	let inputRef: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (open) {
			setTimeout(() => inputRef?.focus(), 0);
		}
	});

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	const bg = { light: 'bg-white', dark: 'bg-neutral-900' };
	const text = { light: 'text-gray-800', dark: 'text-neutral-200' };
	const muted = { light: 'text-gray-400', dark: 'text-neutral-500' };
	const border = { light: 'border-gray-200', dark: 'border-neutral-700/60' };
	const inputBg = { light: 'bg-white', dark: 'bg-neutral-900' };
	const itemHover = { light: 'hover:bg-gray-50', dark: 'hover:bg-neutral-800' };
	const itemIcon = { light: 'text-gray-400', dark: 'text-neutral-500' };
	const kbdBg = { light: 'bg-gray-100 text-gray-500 border-gray-200', dark: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
	const footerBg = { light: 'bg-gray-50', dark: 'bg-neutral-800/50' };
	const sectionText = { light: 'text-gray-400', dark: 'text-neutral-500' };

	const quickLinks = [
		{ icon: Briefcase, labelKey: 'nav.jobs', href: '/jobs' },
		{ icon: Building2, labelKey: 'nav.companies', href: '/companies' },
		{ icon: FileText, labelKey: 'nav.about', href: '/about' }
	];
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[15vh] backdrop-blur-sm"
		onclick={handleBackdrop}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="w-full max-w-lg overflow-hidden rounded-xl shadow-2xl {bg[cs]} {border[cs]} border">
			<div class="flex items-center gap-3 border-b px-4 {border[cs]}">
				<Search size={16} class="{muted[cs]} shrink-0" />
				<input
					bind:this={inputRef}
					type="text"
					placeholder={t('nav.searchPlaceholder')}
					class="h-12 w-full bg-transparent text-sm outline-none {text[cs]} placeholder:{muted[cs]}"
				/>
				<button
					onclick={onclose}
					class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium {kbdBg[cs]}"
				>
					ESC
				</button>
			</div>

			<div class="max-h-80 overflow-y-auto px-2 py-3">
				<div class="px-2 pb-2">
					<span class="text-[10px] font-semibold uppercase tracking-wider {sectionText[cs]}">
						{t('nav.searchQuickLinks')}
					</span>
				</div>

				{#each quickLinks as link}
					<button
						class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors {itemHover[cs]}"
					>
						<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md {itemIcon[cs]} border {border[cs]}">
							<link.icon size={14} />
						</div>
						<span class="flex-1 text-sm {text[cs]}">{t(link.labelKey)}</span>
						<ArrowRight size={14} class={muted[cs]} />
					</button>
				{/each}

				<div class="mt-3 px-2 pb-2">
					<span class="text-[10px] font-semibold uppercase tracking-wider {sectionText[cs]}">
						{t('nav.searchRecent')}
					</span>
				</div>

				<div class="flex items-center justify-center py-6">
					<span class="text-xs {muted[cs]}">{t('nav.searchNoRecent')}</span>
				</div>
			</div>

			<div class="flex items-center gap-4 border-t px-4 py-2.5 {border[cs]} {footerBg[cs]}">
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] {kbdBg[cs]}">
						<span class="text-xs">&uarr;</span>
					</kbd>
					<kbd class="inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] {kbdBg[cs]}">
						<span class="text-xs">&darr;</span>
					</kbd>
					<span class="text-[10px] {muted[cs]}">{t('nav.searchTip')}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] {kbdBg[cs]}">
						&crarr;
					</kbd>
					<span class="text-[10px] {muted[cs]}">{t('nav.searchTipSelect')}</span>
				</div>
				<div class="flex items-center gap-1.5">
					<kbd class="inline-flex h-5 items-center justify-center rounded border px-1 text-[10px] {kbdBg[cs]}">
						esc
					</kbd>
					<span class="text-[10px] {muted[cs]}">{t('nav.searchTipClose')}</span>
				</div>
			</div>
		</div>
	</div>
{/if}
