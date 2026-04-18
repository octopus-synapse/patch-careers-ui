/**
 * Shared theme class tokens for cases where Tailwind's dark: variant
 * cannot be used directly (e.g., dynamically computed class strings).
 *
 * Prefer using dark: classes inline in templates when possible.
 * Only import from here when you need class strings in JS logic.
 */
export const theme = {
  text: 'text-gray-800 dark:text-neutral-200',
  muted: 'text-gray-500 dark:text-neutral-500',
  cardBg: 'bg-white dark:bg-neutral-800/50',
  border: 'border-gray-200 dark:border-neutral-800',
  sidebarBg: 'bg-white dark:bg-neutral-800/30',
  inputBg:
    'bg-white border-gray-300 text-gray-800 placeholder-gray-400 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-500',
  sidebarLink: 'text-gray-700 hover:bg-gray-50 dark:text-neutral-300 dark:hover:bg-neutral-700/50',
  sectionTitle: 'text-gray-800 dark:text-neutral-200',
  skeletonBg: 'bg-gray-200 dark:bg-neutral-700',
  btnSecondary:
    'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800',
} as const;
