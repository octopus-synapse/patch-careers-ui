export { default as Avatar } from './components/avatar/avatar.component.svelte';
export { default as Badge } from './components/badge/badge.component.svelte';
export type { BadgeKind } from './components/badge/badge.types';
export { default as BadgeIcon } from './components/badge/badge-icon.component.svelte';
export { default as Button } from './components/button/button.component.svelte';
/** @deprecated No longer needed — use Tailwind dark: classes instead */
export type { ButtonCase, ButtonSize, ButtonVariant } from './components/button/button.types';
export { default as Card } from './components/card/card.component.svelte';
export { default as Checkbox } from './components/checkbox/checkbox.component.svelte';
export { default as DataTable } from './components/data-table/data-table.component.svelte';
export {
  type DateRangePreset,
  default as DateRangePicker,
} from './components/date-range-picker/date-range-picker.component.svelte';
export { default as Dropdown } from './components/dropdown/dropdown.component.svelte';
export { default as EmptyState } from './components/empty-state/empty-state.component.svelte';
export { default as ExportButton } from './components/export-button/export-button.component.svelte';
export type { FitDimension, FitScoreLabels } from './components/fit-score/fit-score.types';
export { default as FitScoreBreakdown } from './components/fit-score/fit-score-breakdown.component.svelte';
export { default as FitScoreChip } from './components/fit-score/fit-score-chip.component.svelte';
export { default as ScoreCard } from './components/fit-score/score-card.component.svelte';
export {
  RANK_ORDER,
  RANK_RANGES,
  type RankRange,
  rangeOfRank,
  rankOf,
  type ScoreRank,
  toneForRank,
  toneForScore,
} from './components/fit-score/score-rank';
export { default as FormField } from './components/form-field/form-field.component.svelte';
export { default as FormModal } from './components/form-modal/form-modal.component.svelte';
export { default as InfiniteList } from './components/infinite-list/infinite-list.component.svelte';
export { default as InfiniteScrollTrigger } from './components/infinite-list/infinite-scroll-trigger.component.svelte';
export { default as Input } from './components/input/input.component.svelte';
export { default as Textarea } from './components/input/textarea.component.svelte';
export { default as Label } from './components/label/label.component.svelte';
export { default as Loader } from './components/loader/loader.component.svelte';
export { default as MatchBadge } from './components/matching/match-badge.component.svelte';
export { default as RankBadge } from './components/matching/rank-badge.component.svelte';
export { default as ConfirmModal } from './components/modal/confirm-modal.component.svelte';
export { default as DangerConfirmModal } from './components/modal/danger-confirm-modal.component.svelte';
export { default as Modal } from './components/modal/modal.component.svelte';
export {
  type FocusTrapOptions,
  focusTrap,
  prefersReducedMotion,
} from './components/modal/modal.focus-trap';
export { default as OtpInput } from './components/otp-input/otp-input.component.svelte';
export { default as Pagination } from './components/pagination/pagination.component.svelte';
export { default as Poll } from './components/poll/poll.component.svelte';
export type { PollOption } from './components/poll/poll.types';
export { default as Popover } from './components/popover/popover.component.svelte';
export { default as QuoteCard } from './components/quote-card/quote-card.component.svelte';
export { default as Radio } from './components/radio/radio.component.svelte';
export { default as ReactionIcon } from './components/reactions/reaction-icon.component.svelte';
export { default as ReactionPicker } from './components/reactions/reaction-picker.component.svelte';
export { REACTIONS, type ReactionType } from './components/reactions/reactions';
export { default as SearchFilterBar } from './components/search/search-filter-bar.component.svelte';
export { default as SegmentToggle } from './components/search/segment-toggle.component.svelte';
export { default as Select } from './components/select/select.component.svelte';
export { default as Sidebar } from './components/sidebar/sidebar.component.svelte';
export { default as Skeleton } from './components/skeleton/skeleton.component.svelte';
export { default as SliderCarousel } from './components/slider-carousel/slider-carousel.component.svelte';
export { default as StatGrid } from './components/stat-grid/stat-grid.component.svelte';
export type { StatItem } from './components/stat-grid/stat-grid.types';
export { default as Tabs } from './components/tabs/tabs.component.svelte';
export { default as Toast } from './components/toast/toast.component.svelte';
export { toastState } from './components/toast/toast.state.svelte';
export { default as ToastContainer } from './components/toast/toast-container.component.svelte';
export { default as Tooltip } from './components/tooltip/tooltip.component.svelte';
/** @deprecated Use `ColorScheme` from shared types. */
export type { ColorSchema } from './shared';
