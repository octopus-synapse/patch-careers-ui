<script lang="ts">
import type { BadgeKind } from './badge-types';

type Props = {
  kind: BadgeKind;
  size?: number;
};

let { kind, size = 20 }: Props = $props();

const meta: Record<BadgeKind, { glyph: string; label: string; ring: string; bg: string }> = {
  FIRST_BUILD: {
    glyph: '🔨',
    label: 'First Build',
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  ATS_90_PLUS: {
    glyph: '🎯',
    label: 'ATS 90%+',
    ring: 'ring-sky-400',
    bg: 'bg-sky-100 dark:bg-sky-900/40',
  },
  MENTORED_10: {
    glyph: '🧭',
    label: 'Mentored 10',
    ring: 'ring-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/40',
  },
  INTERVIEWS_5: {
    glyph: '💼',
    label: '5 Interviews',
    ring: 'ring-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  CONTRIBUTOR: {
    glyph: '💬',
    label: 'Contributor',
    ring: 'ring-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/40',
  },
  EVENT_SPEAKER: {
    glyph: '🎤',
    label: 'Event Speaker',
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
	title={m.label}
	aria-label={m.label}
	role="img"
>
	<span aria-hidden="true">{m.glyph}</span>
</span>
