/**
 * Editorial palette — the "Editorial Calm" auth/onboarding aesthetic.
 *
 * Warm paper background, deep-ink CTA, hairline rules, blue used sparingly
 * (focus rings + links + accent dot only). These were previously local to
 * `apps/client/src/components/auth/auth-shared.tsx` (`authTokens`); they now
 * live here so the Tamagui wrapper can register an `editorial` sub-theme and
 * `@patch-careers/ui/editorial` components can consume them.
 *
 * Two variants share one shape: `editorialPalette` (light, warm paper) and
 * `editorialPaletteDark` (warm dark paper — near-black with the same warm
 * cast, inverted ink, CTA flips to a light fill). Components resolve the
 * active one via `useEditorialPalette()` in `@patch-careers/ui`.
 *
 * NOTE: the serif/sans/mono font stack stays in `apps/client/tamagui.config.ts`
 * (it needs `Platform.select`, and this package is platform-agnostic). Here we
 * only own the raw hex palette.
 */

export type EditorialPalette = {
  bg: string;
  surface: string;
  /**
   * The standalone panel (auth card) — a lift off `bg` in both schemes, so the
   * card reads as paper laid on the screen rather than a hole cut into it.
   * Neither end goes to pure #fff / #000.
   */
  panel: string;
  ink: string;
  body: string;
  muted: string;
  subtle: string;
  hairline: string;
  hairlineStrong: string;
  accent: string;
  accentDeep: string;
  primary: string;
  primaryPress: string;
  /** Content (label/spinner/glyph) rendered on top of a `primary` fill. */
  onPrimary: string;
  danger: string;
  success: string;
  warn: string;
  fair: string;
};

export const editorialPalette = {
  bg: "#F2F1EC", // warm paper — held off white so long sessions don't glare
  surface: "#FAFAF7",
  panel: "#FDFDFC",
  ink: "#0A0A0A",
  body: "#3F3F46",
  muted: "#71717A",
  subtle: "#A1A1AA",
  hairline: "#E4E4E7",
  hairlineStrong: "#D4D4D8",
  accent: "#2563EB",
  accentDeep: "#1D4ED8",
  primary: "#0F172A", // CTA fill — deep ink, more sophisticated than bright blue
  primaryPress: "#1E293B",
  onPrimary: "#FFFFFF",
  danger: "#DC2626",
  success: "#16A34A",
  warn: "#D97706",
  fair: "#EAB308",
} as const satisfies EditorialPalette;

export const editorialPaletteDark = {
  bg: "#1A1916", // warm dark paper — soft, held well off true black
  surface: "#2B2A26",
  panel: "#232220",
  ink: "#F5F5F0",
  body: "#C8C8C2",
  muted: "#8A8A84",
  subtle: "#5F5F5A",
  hairline: "#2E2D28",
  hairlineStrong: "#3A3933",
  accent: "#60A5FA", // lightened blue for contrast on dark paper
  accentDeep: "#93C5FD",
  primary: "#F5F5F0", // CTA inverts: light fill, dark content
  primaryPress: "#E4E4DE",
  onPrimary: "#1A1916",
  danger: "#F87171",
  success: "#4ADE80",
  warn: "#FBBF24",
  fair: "#FDE047",
} as const satisfies EditorialPalette;

export const editorialPalettes = {
  light: editorialPalette,
  dark: editorialPaletteDark,
} as const;

export type EditorialColor = keyof typeof editorialPalette;

/** The two schemes every themed token set is keyed by. */
export type EditorialTheme = keyof typeof editorialPalettes;

/**
 * Alpha washes the palette above can't model: the dim behind a covering
 * surface, the faint tint behind a destructive affordance, and the text/rule
 * ramp that reads on top of frosted dark glass.
 *
 * Deliberately NOT slots on `EditorialPalette` — every palette value is an
 * opaque 6-digit hex (asserted in `editorial.spec.ts`) and these need alpha.
 * Resolve the active set exactly like the palette: keyed by theme.
 */
export type EditorialOverlays = {
  /**
   * The scrim scale. A covering surface dims what it sits on, and it dims it
   * harder the more exclusively it wants attention — a drawer still shows the
   * context it slid over, a decision must not compete with it. Dark dims
   * deeper throughout so the surface separates from an already-dark backdrop.
   */
  scrimPanel: string;
  scrimDialog: string;
  scrimModal: string;
  /**
   * Dim over a photo (a spinner on the uploading avatar). Identical in both
   * schemes on purpose: a photograph has no light/dark variant to answer to.
   */
  scrimMedia: string;
  /**
   * Faint tint behind a destructive affordance. Tracks the scheme's `danger`,
   * so the dark variant lifts to the lighter red the dark palette uses.
   */
  dangerWash: string;
  /**
   * Text/rule ramp for content sitting ON frosted dark glass (see
   * `editorialGlass.ink`). Near-identical across schemes by design — that glass
   * is black in both, so the ramp answers to the material, not to the app
   * background.
   */
  onGlassInk: string;
  onGlassBody: string;
  onGlassMuted: string;
  onGlassSubtle: string;
  onGlassPressed: string;
  onGlassHairline: string;
};

export const editorialOverlays = {
  light: {
    scrimPanel: "rgba(10,10,10,0.18)",
    scrimDialog: "rgba(10,10,10,0.32)",
    scrimModal: "rgba(10,10,10,0.45)",
    scrimMedia: "rgba(0,0,0,0.4)",
    dangerWash: "rgba(220,38,38,0.08)",
    onGlassInk: "rgba(255,255,255,0.96)",
    onGlassBody: "rgba(255,255,255,0.82)",
    onGlassMuted: "rgba(255,255,255,0.62)",
    onGlassSubtle: "rgba(255,255,255,0.42)",
    onGlassPressed: "rgba(255,255,255,0.09)",
    onGlassHairline: "rgba(255,255,255,0.14)",
  },
  dark: {
    scrimPanel: "rgba(0,0,0,0.5)",
    scrimDialog: "rgba(0,0,0,0.55)",
    scrimModal: "rgba(0,0,0,0.6)",
    scrimMedia: "rgba(0,0,0,0.4)",
    dangerWash: "rgba(248,113,113,0.12)",
    onGlassInk: "rgba(255,255,255,0.96)",
    onGlassBody: "rgba(255,255,255,0.82)",
    onGlassMuted: "rgba(255,255,255,0.62)",
    onGlassSubtle: "rgba(255,255,255,0.42)",
    onGlassPressed: "rgba(255,255,255,0.08)",
    onGlassHairline: "rgba(255,255,255,0.12)",
  },
} as const satisfies Record<EditorialTheme, EditorialOverlays>;

/**
 * A frosted translucent surface: a blur, its strength, and the wash laid over
 * it. The three always travel together, so they live together.
 */
export type FrostedMaterial = {
  tint: "light" | "dark";
  intensity: number;
  wash: string;
};

/**
 * The frosted materials, keyed by theme then by variant:
 *   • `thin`  — faint veil; leans on content scrolling behind it (bottom bar).
 *   • `panel` — near-opaque surface tone; a self-contained card on a flat bg.
 *   • `glass` — very translucent + strong blur, so live content scrolling
 *     behind reads clearly as frosted glass (the pinned Jobs scope bar).
 *   • `ink`   — black glass in BOTH schemes (the account drawer); it is a
 *     material in its own right, not a tint of the background, so content on
 *     it uses the `onGlass*` ramp above rather than the palette.
 */
export const editorialGlass = {
  light: {
    thin: { tint: "light", intensity: 60, wash: "rgba(255,255,255,0.45)" },
    panel: { tint: "light", intensity: 60, wash: "rgba(255,255,255,0.72)" },
    glass: { tint: "light", intensity: 95, wash: "rgba(250,249,245,0.3)" },
    ink: { tint: "dark", intensity: 92, wash: "rgba(12,12,14,0.46)" },
  },
  dark: {
    thin: { tint: "dark", intensity: 50, wash: "rgba(30,29,25,0.4)" },
    panel: { tint: "dark", intensity: 50, wash: "rgba(38,36,31,0.72)" },
    glass: { tint: "dark", intensity: 85, wash: "rgba(24,23,20,0.26)" },
    ink: { tint: "dark", intensity: 82, wash: "rgba(18,17,15,0.52)" },
  },
} as const satisfies Record<EditorialTheme, Record<string, FrostedMaterial>>;

/** Which frosted material to lay down — see `editorialGlass`. */
export type FrostedVariant = keyof typeof editorialGlass.light;
