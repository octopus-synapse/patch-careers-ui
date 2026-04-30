<script lang="ts" generics="T">
import type { Snippet } from 'svelte';
import Button from '../button/button.component.svelte';

type Props<T> = {
  items: T[];
  /** Cards visible at once on desktop. Mobile is always a vertical stack. */
  perView?: number;
  /** Items revealed per "load more" click on mobile. Default matches `perView`. */
  mobilePageSize?: number;
  /** Rendered per item in both desktop slider and mobile list. */
  item: Snippet<[T]>;
  /** Stable key per item — required for keyed each. */
  keyFn: (item: T) => string;
  /** Label for the mobile "load more" button. Default: "Load more". */
  loadMoreLabel?: string;
  /** aria-labels for the nav arrows. */
  prevLabel?: string;
  nextLabel?: string;
  /** Optional custom icons for prev/next. Defaults to unicode chevrons. */
  prevIcon?: Snippet;
  nextIcon?: Snippet;
};

let {
  items,
  perView = 3,
  mobilePageSize,
  item,
  keyFn,
  loadMoreLabel = 'Load more',
  prevLabel = 'Previous',
  nextLabel = 'Next',
  prevIcon,
  nextIcon,
}: Props<T> = $props();

const pageSize = $derived(mobilePageSize ?? perView);

let sliderIndex = $state(0);
// Tracks how many items are revealed on mobile. Starts at one page and grows
// via `revealMore()`. Kept in sync with `pageSize` whenever the consumer's
// `mobilePageSize`/`perView` prop changes, so we never hide content below the
// current page size.
let mobileVisibleCount = $state(0);
$effect(() => {
  if (mobileVisibleCount < pageSize) mobileVisibleCount = pageSize;
});

const maxSliderIndex = $derived(Math.max(0, items.length - perView));
const canPrev = $derived(sliderIndex > 0);
const canNext = $derived(sliderIndex < maxSliderIndex);
const slideStyle = $derived(
  `transform: translateX(calc(-${sliderIndex} * (100% / ${perView})));`,
);
const itemWidthStyle = $derived(`width: calc(100% / ${perView});`);

const mobileList = $derived(items.slice(0, mobileVisibleCount));
const hasMoreMobile = $derived(mobileVisibleCount < items.length);

function prev() {
  if (canPrev) sliderIndex = Math.max(0, sliderIndex - 1);
}
function next() {
  if (canNext) sliderIndex = Math.min(maxSliderIndex, sliderIndex + 1);
}
function revealMore() {
  mobileVisibleCount = Math.min(items.length, mobileVisibleCount + pageSize);
}
</script>

<!-- Desktop: perView slider with side-anchored arrows -->
<div class="relative hidden sm:block">
	<div class="overflow-hidden px-5 py-4">
		<div class="flex transition-transform duration-300 ease-out" style={slideStyle}>
			{#each items as entry (keyFn(entry))}
				<div class="flex-shrink-0 px-2" style={itemWidthStyle}>
					{@render item(entry)}
				</div>
			{/each}
		</div>
	</div>
	{#if canPrev}
		<Button
			variant="icon"
			size="sm"
			onclick={prev}
			aria-label={prevLabel}
			class="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 !rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
		>
			{#if prevIcon}
				{@render prevIcon()}
			{:else}
				<span aria-hidden="true" class="text-base leading-none">‹</span>
			{/if}
		</Button>
	{/if}
	{#if canNext}
		<Button
			variant="icon"
			size="sm"
			onclick={next}
			aria-label={nextLabel}
			class="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 !rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
		>
			{#if nextIcon}
				{@render nextIcon()}
			{:else}
				<span aria-hidden="true" class="text-base leading-none">›</span>
			{/if}
		</Button>
	{/if}
</div>

<!-- Mobile: vertical stack with reveal-more button -->
<div class="flex flex-col gap-3 px-3 py-3 sm:hidden">
	{#each mobileList as entry (keyFn(entry))}
		{@render item(entry)}
	{/each}
	{#if hasMoreMobile}
		<Button variant="outline" size="sm" fullWidth textCase="normal" onclick={revealMore}>
			{loadMoreLabel}
		</Button>
	{/if}
</div>
