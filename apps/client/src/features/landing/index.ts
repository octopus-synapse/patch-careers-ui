/**
 * `features/landing` — the public marketing page served at `/` on web.
 *
 * Web-only by construction: the route that mounts this is `app/index.web.tsx`,
 * so the native bundle never reaches it. The feature is a leaf — nothing else
 * in the app imports it, and it imports no other feature.
 */

// The mascot mark moved to the DS once the app chrome started wearing it too
// (the web navbar shows it on every page). Re-exported here so the landing's
// own call sites keep reading as feature-local.
export { BrandFace } from "@patch-careers/ui/editorial";
export { LandingHead } from "./components/landing-head";
export { LandingScreen } from "./components/landing-screen";
export { landingSans } from "./lib/landing-fonts";
export { CHAPTERS } from "./model/chapters";
export type { ChapterKey, ChapterSpec } from "./types";
