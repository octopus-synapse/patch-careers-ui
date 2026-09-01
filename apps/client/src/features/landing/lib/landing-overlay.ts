/**
 * The marker every overlay above the landing carries.
 *
 * Overlays (the auth dialog, the preferences modal, the consent dialog's
 * portal) set `dataSet={{ landingOverlay: "" }}` on their root, which
 * react-native-web emits as the HYPHENATED `data-landing-overlay` attribute —
 * not `data-landingoverlay`, which is the mistake worth writing down.
 *
 * Two consumers read it: `useDeckInput` goes inert while one is mounted (the
 * overlay's own scroll areas must get the wheel), and `useOverlayPresence`
 * hides the mascot — he cannot lean on the dialog's card and stand in the
 * deck's column at the same time.
 */
export const LANDING_OVERLAY_SELECTOR = "[data-landing-overlay]";

export function isOverlayOpen(): boolean {
  return (
    typeof document !== "undefined" && document.querySelector(LANDING_OVERLAY_SELECTOR) !== null
  );
}
