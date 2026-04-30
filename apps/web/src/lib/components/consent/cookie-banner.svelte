<script lang="ts">
import { onMount } from 'svelte';
import { Cookie, X } from 'lucide-svelte';
import { Button, Checkbox } from 'ui';
import { consentStore } from '$lib/state/consent-store.svelte';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);

let mode = $state<'banner' | 'details' | 'hidden'>('hidden');
let analytics = $state(false);
let marketing = $state(false);

function show() {
  analytics = consentStore.current?.analytics ?? false;
  marketing = consentStore.current?.marketing ?? false;
  mode = 'banner';
}

function hide() {
  mode = 'hidden';
}

function acceptAll() {
  consentStore.save({ analytics: true, marketing: true });
  hide();
}

function acceptEssential() {
  consentStore.save({ analytics: false, marketing: false });
  hide();
}

function savePreferences() {
  consentStore.save({ analytics, marketing });
  hide();
}

onMount(() => {
  consentStore.hydrate();
  if (consentStore.needsDecision) {
    show();
  }
  const handler = () => show();
  window.addEventListener('cookie-consent:reopen', handler);
  return () => window.removeEventListener('cookie-consent:reopen', handler);
});
</script>

{#if mode !== 'hidden'}
  {#if mode === 'details'}
    <!-- Expanded preferences modal — only when the user explicitly opens it. -->
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-banner-title"
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[60] rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg p-5"
    >
      <div class="flex items-start gap-3">
        <Cookie size={20} class="mt-0.5 text-gray-600 dark:text-neutral-400" />
        <div class="flex-1">
          <h2 id="cookie-banner-title" class="font-semibold text-gray-900 dark:text-neutral-100">
            {t('cookies.banner.title')}
          </h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-neutral-400">
            {t('cookies.banner.body')}
            <a href="/legal/cookies" class="underline">{t('cookies.banner.learnMore')}</a>
          </p>

          <div class="mt-4 space-y-2 text-sm">
            <Checkbox checked disabled class="gap-3">
              <span>
                <strong>{t('cookies.categories.essential.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.essential.desc')}
                </span>
              </span>
            </Checkbox>
            <Checkbox bind:checked={analytics} class="gap-3">
              <span>
                <strong>{t('cookies.categories.analytics.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.analytics.desc')}
                </span>
              </span>
            </Checkbox>
            <Checkbox bind:checked={marketing} class="gap-3">
              <span>
                <strong>{t('cookies.categories.marketing.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.marketing.desc')}
                </span>
              </span>
            </Checkbox>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onclick={savePreferences}>
              {t('cookies.banner.savePreferences')}
            </Button>
            <Button size="sm" variant="ghost" onclick={() => (mode = 'banner')}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Compact one-line bar: text + Aceitar (primary) + Personalizar (link).
         Per UX feedback #26: less obtrusive, single dominant CTA, LGPD-safe
         because no tracking fires until consent is saved. -->
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      class="fixed bottom-3 left-3 right-3 md:left-auto md:right-4 md:max-w-2xl z-[60] flex flex-col items-start gap-3 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md px-4 py-3 sm:flex-row sm:items-center"
    >
      <Cookie size={18} class="shrink-0 text-gray-500 dark:text-neutral-400" />
      <p id="cookie-banner-title" class="flex-1 text-sm text-gray-700 dark:text-neutral-300">
        {t('cookies.banner.body')}
        <a href="/legal/cookies" class="underline">{t('cookies.banner.learnMore')}</a>
      </p>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onclick={() => (mode = 'details')}
          class="text-xs text-gray-500 hover:underline dark:text-neutral-400"
        >
          {t('cookies.banner.customize')}
        </button>
        <Button size="sm" onclick={acceptAll}>
          {t('cookies.banner.acceptAll')}
        </Button>
        <button
          type="button"
          onclick={acceptEssential}
          aria-label={t('cookies.banner.dismiss')}
          class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:text-neutral-500 dark:hover:bg-neutral-800"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  {/if}
{/if}
