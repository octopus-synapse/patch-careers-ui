<script lang="ts">
import { onMount } from 'svelte';
import { Cookie, X } from 'lucide-svelte';
import { Button } from 'ui';
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
  <div
    role="dialog"
    aria-modal="false"
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

        {#if mode === 'details'}
          <div class="mt-4 space-y-2 text-sm">
            <label class="flex items-start gap-3 opacity-70">
              <input type="checkbox" checked disabled class="mt-1" />
              <span>
                <strong>{t('cookies.categories.essential.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.essential.desc')}
                </span>
              </span>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={analytics} class="mt-1" />
              <span>
                <strong>{t('cookies.categories.analytics.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.analytics.desc')}
                </span>
              </span>
            </label>
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={marketing} class="mt-1" />
              <span>
                <strong>{t('cookies.categories.marketing.name')}</strong>
                <span class="block text-xs text-gray-500 dark:text-neutral-400">
                  {t('cookies.categories.marketing.desc')}
                </span>
              </span>
            </label>
          </div>
        {/if}

        <div class="mt-4 flex flex-wrap gap-2">
          {#if mode === 'details'}
            <Button size="sm" onclick={savePreferences}>
              {t('cookies.banner.savePreferences')}
            </Button>
          {:else}
            <Button size="sm" onclick={acceptAll}>
              {t('cookies.banner.acceptAll')}
            </Button>
            <Button size="sm" variant="ghost" onclick={acceptEssential}>
              {t('cookies.banner.acceptEssential')}
            </Button>
            <Button size="sm" variant="ghost" onclick={() => (mode = 'details')}>
              {t('cookies.banner.customize')}
            </Button>
          {/if}
        </div>
      </div>
      <Button
        variant="icon"
        size="sm"
        onclick={acceptEssential}
        aria-label={t('cookies.banner.dismiss')}
      >
        <X size={16} />
      </Button>
    </div>
  </div>
{/if}
