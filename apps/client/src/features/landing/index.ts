/**
 * `features/landing` — the public marketing page served at `/` on web.
 *
 * Web-only by construction: the route that mounts this is `app/index.web.tsx`,
 * so the native bundle never reaches it. The feature is a leaf — nothing else
 * in the app imports it, and it imports no other feature.
 */

export { LandingScreen } from "./components/landing-screen";
export { CHAPTERS } from "./model/chapters";
export type { ChapterKey, ChapterSpec } from "./types";
