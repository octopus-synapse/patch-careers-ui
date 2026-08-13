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

/**
 * Alpha washes the palette above can't model: the scrim behind a modal, and the
 * frosted drawer material (a translucent wash over a blur, plus the text/rule
 * ramp that sits on top of that dark glass).
 *
 * Deliberately NOT slots on `EditorialPalette` — every palette value is an
 * opaque 6-digit hex (asserted in `editorial.spec.ts`) and these need alpha.
 * Components resolve the active set exactly like the palette: keyed by theme.
 */
export type EditorialOverlays = {
  /**
   * Dim behind a modal/drawer. Light paper takes a soft wash — a heavy dim
   * reads wrong on it; dark needs a deeper one so the panel separates from an
   * already-dark backdrop.
   */
  scrim: string;
  /** Translucent material painted over the drawer's blur. */
  glassWash: string;
  /** Tint + strength of that same blur. */
  glassTint: "dark";
  glassIntensity: number;
  /**
   * Text/rule ramp for content sitting ON the dark glass. Near-identical across
   * schemes by design — the glass is black in both, so the ramp answers to the
   * material, not to the app background.
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
    scrim: "rgba(10,10,10,0.18)",
    glassWash: "rgba(12,12,14,0.46)",
    glassTint: "dark",
    glassIntensity: 92,
    onGlassInk: "rgba(255,255,255,0.96)",
    onGlassBody: "rgba(255,255,255,0.82)",
    onGlassMuted: "rgba(255,255,255,0.62)",
    onGlassSubtle: "rgba(255,255,255,0.42)",
    onGlassPressed: "rgba(255,255,255,0.09)",
    onGlassHairline: "rgba(255,255,255,0.14)",
  },
  dark: {
    scrim: "rgba(0,0,0,0.5)",
    glassWash: "rgba(18,17,15,0.52)",
    glassTint: "dark",
    glassIntensity: 82,
    onGlassInk: "rgba(255,255,255,0.96)",
    onGlassBody: "rgba(255,255,255,0.82)",
    onGlassMuted: "rgba(255,255,255,0.62)",
    onGlassSubtle: "rgba(255,255,255,0.42)",
    onGlassPressed: "rgba(255,255,255,0.08)",
    onGlassHairline: "rgba(255,255,255,0.12)",
  },
} as const satisfies Record<keyof typeof editorialPalettes, EditorialOverlays>;
