<script lang="ts">
type Props = { count?: number };
let { count = 3 }: Props = $props();
</script>

<div class="space-y-4">
	{#each Array.from({ length: count }) as _, i (i)}
		<div
			class="animate-pulse rounded-xl border border-gray-200 dark:border-neutral-700/50 p-4 space-y-3"
		>
			<div class="flex gap-3">
				<div class="h-12 w-12 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
				<div class="flex-1 space-y-2">
					<div class="h-3 w-1/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
					<div class="h-2 w-1/4 rounded bg-gray-200 dark:bg-neutral-700"></div>
				</div>
			</div>
			<div class="space-y-2">
				<div class="h-3 w-full rounded bg-gray-200 dark:bg-neutral-700"></div>
				<div class="h-3 w-2/3 rounded bg-gray-200 dark:bg-neutral-700"></div>
			</div>
		</div>
	{/each}
</div>
