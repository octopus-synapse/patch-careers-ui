/** Native scroll distance becomes a held scene, readable overflow, then a camera move. */
import { deckEase } from "./deck-easing";
import { chapterAtOffset, topsFor } from "./deck-math";

export interface ScrollScene {
  readonly start: number;
  readonly hold: number;
  readonly overflow: number;
  readonly travel: number;
  readonly top: number;
}
export interface ScrollTimeline {
  readonly scenes: readonly ScrollScene[];
  readonly heights: readonly number[];
  readonly viewport: number;
  readonly range: number;
}

export function createScrollTimeline(
  heights: readonly number[],
  viewport: number,
  compact = false,
  reduced = false,
  holds: readonly (number | undefined)[] = [],
): ScrollTimeline {
  const unit = Math.max(1, viewport);
  let start = 0;
  let top = 0;
  const scenes = heights.map((height, index) => {
    const last = index === heights.length - 1;
    const hold = reduced
      ? 0
      : unit *
        (holds[index] !== undefined
          ? (holds[index] ?? 0) * (compact ? 0.65 : 1)
          : compact
            ? 0.08
            : index === 0
              ? 0.25
              : 0.12);
    const overflow = Math.max(0, height - unit);
    const travel = last ? 0 : unit * (reduced || compact ? 1 : 1.12);
    const scene = { start, hold, overflow, travel, top };
    start += hold + overflow + travel;
    top += height;
    return scene;
  });
  return { scenes, heights, viewport: unit, range: start };
}

export function readScrollTimeline(scroll: number, timeline: ScrollTimeline) {
  const { scenes, heights, viewport, range } = timeline;
  const bounded = Math.max(0, Math.min(range, scroll));
  let sceneIndex = 0;
  for (let at = scenes.length - 1; at >= 0; at -= 1) {
    if (bounded >= (scenes[at]?.start ?? 0)) {
      sceneIndex = at;
      break;
    }
  }
  const scene = scenes[sceneIndex];
  if (!scene) return { offset: 0, position: 0, focus: 1, index: 0, settledIndex: 0 };
  const local = bounded - scene.start;
  const inside = Math.max(0, Math.min(scene.overflow, local - scene.hold));
  const transition =
    scene.travel === 0
      ? 0
      : Math.max(0, Math.min(1, (local - scene.hold - scene.overflow) / scene.travel));
  // The easing is a function of POSITION. Reversing a gesture reverses the same frame.
  const offset = scene.top + inside + deckEase(transition) * viewport;
  const duration = scene.hold + scene.overflow + scene.travel;
  const position = sceneIndex + (duration > 0 ? Math.min(1, local / duration) : 0);
  return {
    offset,
    focus: sceneIndex + (scene.hold > 0 ? Math.min(1, local / scene.hold) : 1),
    position: Math.min(Math.max(0, heights.length - 1), position),
    index: chapterAtOffset(offset, topsFor(heights), heights, viewport),
    settledIndex: sceneIndex,
  };
}

/** Retain the current scene and reading position when fonts or viewport dimensions change. */
export function remapScroll(scroll: number, before: ScrollTimeline, after: ScrollTimeline): number {
  const sample = readScrollTimeline(scroll, before);
  const old = before.scenes[sample.settledIndex];
  const next = after.scenes[sample.settledIndex];
  if (!old || !next) return 0;
  const local = Math.max(0, scroll - old.start);
  if (local <= old.hold) return next.start + (old.hold ? local / old.hold : 0) * next.hold;
  if (local <= old.hold + old.overflow) {
    return next.start + next.hold + Math.min(next.overflow, local - old.hold);
  }
  const fraction = old.travel ? (local - old.hold - old.overflow) / old.travel : 0;
  return Math.min(after.range, next.start + next.hold + next.overflow + fraction * next.travel);
}
