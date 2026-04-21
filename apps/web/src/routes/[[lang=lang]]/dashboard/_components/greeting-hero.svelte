<script lang="ts">
import { locale } from '$lib/state/locale.svelte';
import { timeTicker } from '$lib/state/time-ticker.svelte';

type Props = {
  name: string;
};

let { name }: Props = $props();

const t = $derived(locale.t);

function greetingKey(nowMs: number): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date(nowMs).getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

const firstName = $derived(name.split(' ')[0] ?? name);
const greeting = $derived(t(`dashboard.${greetingKey(timeTicker.now)}`, { name: firstName }));
</script>

<section class="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 dark:border-neutral-700/50 dark:from-neutral-800 dark:to-neutral-900">
	<h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-neutral-100">
		{greeting}
	</h1>
	<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
		{t('dashboard.heroSubtitle')}
	</p>
</section>
