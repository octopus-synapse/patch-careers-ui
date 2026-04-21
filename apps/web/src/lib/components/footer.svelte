<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
  <div class="mx-auto max-w-6xl px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-neutral-400">
    <div>
      © {year} patch-careers — {t('footer.tagline')}
    </div>
    <nav class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <a href="/legal/termos" class="hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
        {t('footer.terms')}
      </a>
      <a href="/legal/privacidade" class="hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
        {t('footer.privacy')}
      </a>
      <a href="/legal/cookies" class="hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
        {t('footer.cookies')}
      </a>
      <a href="/contato" class="hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
        {t('footer.contact')}
      </a>
      <a href="mailto:dpo@patchcareers.com" class="hover:text-gray-800 dark:hover:text-neutral-200 transition-colors">
        DPO: dpo@patchcareers.com
      </a>
    </nav>
  </div>
</footer>
