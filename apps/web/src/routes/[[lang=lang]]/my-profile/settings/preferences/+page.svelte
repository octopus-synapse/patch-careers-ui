<script lang="ts">
import type { Locale } from 'i18n';
import { Globe, Moon, Sun } from 'lucide-svelte';
import { SegmentToggle } from 'ui';
import { colorSchema } from '$lib/state/color-schema.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
const localeOptions = $derived(
  locale.locales.map((l: string) => ({ value: l, label: l === 'pt-BR' ? 'PT' : 'EN' })),
);

function handleThemeToggle(value: string) {
  if (value !== colorSchema.mode) colorSchema.toggle();
}

function handleLocaleChange(value: string) {
  locale.set(value as Locale);
}
</script>

<svelte:head>
	<title>{t('settings.preferences')} · {t('settings.pageTitle')}</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-4">
		<span class="text-xs font-medium text-gray-500 dark:text-neutral-500">
			{t('settings.pageTitle')}
		</span>
		<h3 class="text-sm font-bold text-gray-800 dark:text-neutral-200">
			{t('settings.preferences')}
		</h3>
	</div>

	<section
		class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-800/50"
	>
		<div class="border-b border-gray-200 px-5 py-4 dark:border-neutral-800">
			<h2 class="text-xs font-medium text-gray-500 dark:text-neutral-500">
				{t('settings.preferences')}
			</h2>
		</div>
		<div class="space-y-4 p-5">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Sun size={16} class="hidden text-neutral-500 dark:block" />
					<Moon size={16} class="block text-gray-500 dark:hidden" />
					<span class="text-sm text-gray-800 dark:text-neutral-200">{t('settings.theme')}</span>
				</div>
				<SegmentToggle
					options={themeOptions}
					selected={colorSchema.mode}
					onchange={handleThemeToggle}
				/>
			</div>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Globe size={16} class="text-gray-500 dark:text-neutral-500" />
					<span class="text-sm text-gray-800 dark:text-neutral-200">{t('settings.language')}</span>
				</div>
				<SegmentToggle
					options={localeOptions}
					selected={locale.current}
					onchange={handleLocaleChange}
				/>
			</div>
		</div>
	</section>
</div>
