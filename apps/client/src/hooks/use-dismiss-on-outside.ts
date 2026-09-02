/**
 * `useDismissOnOutside` — the web-native dismissal a popover needs: any click
 * that lands outside the anchor closes it, and so does Escape.
 *
 * Listening on `document` in the CAPTURE phase is deliberate: a bubbling
 * listener never sees a click that a child stopped, and the popover must close
 * even when the thing you clicked handles its own press. Anchor containment is
 * checked against the node itself, so pressing inside the panel never dismisses
 * it — which is why callers wrap anchor AND panel in one plain `<View>` (RN
 * Views are already `position: relative`, so that same wrapper doubles as the
 * absolute panel's containing block).
 *
 * A no-op without a DOM: on native there is no outside-click to hear.
 */

import { type RefObject, useEffect, useRef } from "react";
import type { View } from "react-native";

export function useDismissOnOutside(
  anchor: RefObject<View | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  // Callers pass an inline arrow; holding it in a ref keeps the listeners from
  // being torn down and re-added on every render of the bar.
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (!open || typeof document === "undefined") return;

    const onPointerDown = (event: MouseEvent): void => {
      // On web the RN ref IS the DOM element.
      const node = anchor.current as unknown as HTMLElement | null;
      if (node && event.target instanceof Node && node.contains(event.target)) return;
      dismiss.current();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") dismiss.current();
    };

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, open]);
}
