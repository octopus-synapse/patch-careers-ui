<script lang="ts">
type Props = { count?: number };
let { count = 3 }: Props = $props();
</script>

<div class="space-y-4">
	{#each Array.from({ length: count }) as _, i (i)}
		<div class="glass glass-reflect animate-pulse space-y-4 rounded-[28px] p-5 sm:p-6">
			<div class="flex gap-3">
				<div class="h-12 w-12 rounded-xl bg-black/10 dark:bg-white/10"></div>
				<div class="flex-1 space-y-2 pt-1">
					<div class="h-3 w-1/3 rounded bg-black/10 dark:bg-white/10"></div>
					<div class="h-2 w-1/4 rounded bg-black/10 dark:bg-white/10"></div>
				</div>
				<div class="h-6 w-16 rounded-full bg-black/5 dark:bg-white/5"></div>
			</div>
			<div class="space-y-2">
				<div class="h-3 w-full rounded bg-black/10 dark:bg-white/10"></div>
				<div class="h-3 w-11/12 rounded bg-black/10 dark:bg-white/10"></div>
				<div class="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10"></div>
			</div>
			<div class="flex gap-3 pt-2">
				<div class="h-8 w-20 rounded-xl bg-black/5 dark:bg-white/5"></div>
				<div class="h-8 w-16 rounded-xl bg-black/5 dark:bg-white/5"></div>
				<div class="h-8 w-16 rounded-xl bg-black/5 dark:bg-white/5"></div>
				<div class="ml-auto h-8 w-10 rounded-xl bg-black/5 dark:bg-white/5"></div>
			</div>
		</div>
	{/each}
</div>
