/**
 * The landing's grid, ported measurement-for-measurement from the prototype.
 *
 * The prototype is a 1280px centred container with 24px gutters holding a
 * 12-column grid with 48px gaps: the copy takes 7 columns, the mascot's stage
 * takes 5. Reproducing the arithmetic (rather than eyeballing percentages) is
 * what puts the heading's left edge and the mascot's centre on exactly the
 * same pixels as the reference at any window width.
 */

const MAX_CONTAINER = 1280;
const GUTTER = 24;
const COLUMNS = 12;
const GAP = 48;
const COPY_COLUMNS = 7;

export interface LandingGrid {
  /** Outer container width (capped, then centred by the parent). */
  readonly container: number;
  /** Left inset of the content — where the heading starts. */
  readonly gutter: number;
  /** Width of the copy column. */
  readonly copyWidth: number;
  /** Width of the mascot's column. */
  readonly stageWidth: number;
  /** Distance from the window's left edge to the stage column's left edge. */
  readonly stageLeft: number;
}

export function landingGrid(windowWidth: number): LandingGrid {
  const container = Math.min(MAX_CONTAINER, windowWidth);
  const content = container - GUTTER * 2;
  const column = (content - GAP * (COLUMNS - 1)) / COLUMNS;
  const span = (columns: number): number => columns * column + GAP * (columns - 1);

  const copyWidth = span(COPY_COLUMNS);
  const stageWidth = span(COLUMNS - COPY_COLUMNS);
  const outerInset = (windowWidth - container) / 2 + GUTTER;

  return {
    container,
    gutter: outerInset,
    copyWidth,
    stageWidth,
    stageLeft: outerInset + copyWidth + GAP,
  };
}

/** The mascot artwork's own width in the design system. */
export const MASCOT_WIDTH = 375;

/* ------------------------------------------------------------------ */
/* The scene (chapter 4): mascot and robot side by side, feet aligned  */
/* ------------------------------------------------------------------ */

/** The demo's gap between the pair, and the robot's rendered size. */
const SCENE_GAP = 90;
export const SCENE_ROBOT_WIDTH = 210;
export const SCENE_ROBOT_HEIGHT = (SCENE_ROBOT_WIDTH / 200) * 250;

/**
 * The mascot stage's fixed vertical anatomy (all values mirror
 * `AuthMascotCard` at 0.75 scale): the stage centres a block of
 * `MASCOT_CARD_TOP_SPACE (200) + card (~168)`; the boots' soles reach ~36px
 * below the card's top edge (artwork y≈280 against the card top's 232).
 */
const STAGE_BLOCK_HEIGHT = 200 + 168;
const FEET_BELOW_BLOCK_TOP = 200 + 75;

export interface SceneLayout {
  /** Where the walking mascot's left edge lands, in window coords. */
  readonly mascotLeft: number;
  /** Robot's absolute box, in window coords. */
  readonly robotLeft: number;
  readonly robotTop: number;
  /** Signed distance the stage mascot walks from its column to the pair. */
  readonly walkDx: number;
}

/** Centres the pair `[mascot] 90px [robot]` and puts both feet on one line. */
export function sceneLayout(windowWidth: number, windowHeight: number): SceneLayout {
  const grid = landingGrid(windowWidth);
  const total = MASCOT_WIDTH + SCENE_GAP + SCENE_ROBOT_WIDTH;
  const mascotLeft = (windowWidth - total) / 2;
  const stageMascotLeft = grid.stageLeft + (grid.stageWidth - MASCOT_WIDTH) / 2;
  const blockTop = (windowHeight - STAGE_BLOCK_HEIGHT) / 2;
  const feetY = blockTop + FEET_BELOW_BLOCK_TOP;
  return {
    mascotLeft,
    robotLeft: mascotLeft + MASCOT_WIDTH + SCENE_GAP,
    robotTop: feetY - SCENE_ROBOT_HEIGHT,
    walkDx: mascotLeft - stageMascotLeft,
  };
}

/** The demo's gait: 420px/s, never under 0.9s. */
export function walkMsFor(distance: number): number {
  return Math.max(900, (Math.abs(distance) / 420) * 1000);
}
