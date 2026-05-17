<script lang="ts">
import { locale } from '$lib/state/locale.svelte';

const t = $derived(locale.t);
const now = Date.now();
</script>

<div class="p-[100px] text-center">
	<h1 class="text-[48px]">{t('admin.devTools.test404Heading')}</h1>
	<p>Rendered at: {now}</p>
	<p>This page has zero dependencies.</p>
</div>
