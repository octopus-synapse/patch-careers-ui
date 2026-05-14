<script lang="ts">
import type { BadgeKind } from './badge.types';

type Props = {
  kind: BadgeKind;
  size?: number;
  /** Translated label for title/aria-label. Required — packages/ui stays
   *  locale-agnostic, so the caller (apps/web) is responsible for
   *  resolving the human text via `t('ui.badgeIcon.<kind>')`. */
  label: string;
};

let { kind, size = 20, label }: Props = $props();

const meta: Record<BadgeKind, { glyph: string; ring: string; bg: string }> = {
  FIRST_BUILD: {
    glyph: '🔨',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  ATS_90_PLUS: {
    glyph: '🎯',
    ring: 'ring-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-900/40',
  },
  MENTORED_10: {
    glyph: '🧭',
    ring: 'ring-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
  },
  INTERVIEWS_5: {
    glyph: '💼',
    ring: 'ring-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  CONTRIBUTOR: {
    glyph: '💬',
    ring: 'ring-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
  },
  EVENT_SPEAKER: {
    glyph: '🎤',
    ring: 'ring-fuchsia-400',
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
  },
};

const m = $derived(meta[kind]);
</script>

<span
	class="inline-flex items-center justify-center rounded-full ring-2 {m.ring} {m.bg}"
	style:width="{size}px"
	style:height="{size}px"
	style:font-size="{Math.round(size * 0.55)}px"
	title={label}
	aria-label={label}
	role="img"
>
	<span aria-hidden="true">{m.glyph}</span>
</span>
