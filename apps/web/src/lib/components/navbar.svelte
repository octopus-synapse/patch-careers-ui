<script lang="ts">
	import { colorSchema } from '$lib/color-schema.svelte';
	import { loadDictionary, createTranslator, DEFAULT_LOCALE } from 'i18n';
	import type { Translator } from 'i18n';
	import { Menu, X } from 'lucide-svelte';
	import ColorSchemaToggle from './color-schema-toggle.svelte';

	const cs = $derived(colorSchema.mode);

	let isMenuOpen = $state(false);
	let t = $state<Translator | null>(null);

	$effect(() => {
		loadDictionary(DEFAULT_LOCALE).then((dict) => {
			t = createTranslator(dict);
		});
	});

	function closeMenu() {
		isMenuOpen = false;
	}

	const styles = {
		border: { light: 'border-gray-200/60', dark: 'border-neutral-800/60' },
		text: { light: 'text-gray-800', dark: 'text-neutral-200' },
		muted: { light: 'text-gray-500', dark: 'text-neutral-500' },
		bg: { light: 'bg-gray-50/80', dark: 'bg-neutral-900/80' },
		mobileBg: { light: 'bg-gray-50', dark: 'bg-neutral-900' },
		link: {
			light: 'text-gray-500 hover:text-gray-800',
			dark: 'text-neutral-500 hover:text-neutral-200'
		},
		join: {
			light: 'border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-gray-50',
			dark: 'border-neutral-200 text-neutral-200 hover:bg-neutral-200 hover:text-neutral-900'
		},
		cta: {
			light: 'bg-gray-800 text-gray-50',
			dark: 'bg-neutral-200 text-neutral-900'
		}
	};

	const navLinks = [
		{ key: 'nav.jobs', href: '/jobs' },
		{ key: 'nav.companies', href: '/companies' },
		{ key: 'nav.about', href: '/about' }
	];
</script>

{#if t}
	<nav class="fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-md transition-colors duration-300 {styles.border[cs]} {styles.bg[cs]}">
		<div class="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
			<a href="/" class="text-sm font-bold tracking-tight {styles.text[cs]}">
				patch<span class="font-light opacity-40">careers</span>
			</a>

			<div class="hidden items-center gap-8 md:flex">
				{#each navLinks as link}
					<a
						href={link.href}
						class="text-[10px] font-semibold uppercase tracking-widest transition-colors {styles.link[cs]}"
					>
						{t(link.key)}
					</a>
				{/each}
			</div>

			<div class="flex items-center gap-4">
				<div class="hidden md:block">
					<ColorSchemaToggle />
				</div>

				<a
					href="/signup"
					class="hidden rounded-full border px-5 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all md:block {styles.join[cs]}"
				>
					{t('nav.join')}
				</a>

				<button
					onclick={() => (isMenuOpen = !isMenuOpen)}
					class="rounded-lg p-1.5 transition-colors md:hidden {styles.muted[cs]}"
					aria-label={isMenuOpen ? t('nav.close') : t('nav.menu')}
				>
					{#if isMenuOpen}
						<X size={20} />
					{:else}
						<Menu size={20} />
					{/if}
				</button>
			</div>
		</div>

		{#if isMenuOpen}
			<div class="fixed inset-0 top-[57px] z-40 p-8 md:hidden {styles.mobileBg[cs]}">
				<div class="flex h-full flex-col justify-between">
					<div class="flex flex-col gap-8 pt-4">
						{#each navLinks as link}
							<a
								href={link.href}
								onclick={closeMenu}
								class="text-3xl font-medium tracking-tight transition-opacity hover:opacity-60 {styles.text[cs]}"
							>
								{t(link.key)}
							</a>
						{/each}
					</div>

					<div class="flex flex-col gap-6 pb-8">
						<div class="flex items-center justify-between border-t pt-6 {styles.border[cs]}">
							<span class="text-[10px] font-semibold uppercase tracking-widest {styles.muted[cs]}">
								{t('nav.theme')}
							</span>
							<ColorSchemaToggle />
						</div>

						<a
							href="/signup"
							onclick={closeMenu}
							class="w-full rounded-full py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform active:scale-[0.98] {styles.cta[cs]}"
						>
							{t('nav.getStarted')}
						</a>
					</div>
				</div>
			</div>
		{/if}
	</nav>
{/if}
