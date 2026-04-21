<script lang="ts">
import { CalendarDays } from 'lucide-svelte';
import { Card } from 'ui';
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
</script>

<Card>
	{#snippet title()}
		<h2 class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-neutral-200">
			<CalendarDays size={16} />
			{t('dashboard.eventsTitle')}
		</h2>
	{/snippet}

	<div class="flex flex-col items-start gap-2 py-2">
		<p class="text-xs text-gray-500 dark:text-neutral-500">
			{t('dashboard.eventsEmpty')}
		</p>
		<p class="text-[11px] text-gray-400 dark:text-neutral-600">
			{t('dashboard.eventsComingSoon')}
		</p>
	</div>
</Card>
