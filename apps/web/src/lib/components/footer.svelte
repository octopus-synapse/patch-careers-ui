<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div class="grid gap-8 md:grid-cols-3">
      <div class="md:col-span-1">
        <p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">patch-careers</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-neutral-500">{t('footer.tagline')}</p>
      </div>

      <nav class="md:col-span-1">
        <p class="text-xs font-semibold text-gray-700 dark:text-neutral-300">{t('footer.companyHeading')}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li>
            <a href="/contato" class="text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors">
              {t('footer.contact')}
            </a>
          </li>
        </ul>
      </nav>

      <nav class="md:col-span-1">
        <p class="text-xs font-semibold text-gray-700 dark:text-neutral-300">{t('footer.legalHeading')}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li>
            <a href="/legal/termos" class="text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors">
              {t('footer.terms')}
            </a>
          </li>
          <li>
            <a href="/legal/privacidade" class="text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors">
              {t('footer.privacy')}
            </a>
          </li>
          <li>
            <a href="/legal/cookies" class="text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors">
              {t('footer.cookies')}
            </a>
          </li>
          <li>
            <a href="mailto:dpo@patchcareers.com" class="text-gray-500 hover:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors">
              {t('footer.dpo')}: dpo@patchcareers.com
            </a>
          </li>
        </ul>
      </nav>
    </div>

    <p class="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-neutral-800/80 dark:text-neutral-500">
      © {year} patch-careers
    </p>
  </div>
</footer>
