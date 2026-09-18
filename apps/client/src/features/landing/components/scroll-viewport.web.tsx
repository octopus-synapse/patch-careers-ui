import { MotionConfig } from "framer-motion";
import type { ReactElement } from "react";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { EDITORIAL_EASE } from "../lib/motion-presets";
import type { ScrollViewportProps } from "./scroll-viewport";

/** Native momentum and a sticky stage, inside the app's non-scrolling HTML shell. */
export function ScrollViewport({
  deck,
  height,
  paused,
  children,
}: ScrollViewportProps): ReactElement {
  const reduced = useLandingMotionContext()?.reduced ?? true;
  return (
    <MotionConfig
      reducedMotion={reduced ? "always" : "never"}
      transition={{ duration: reduced ? 0 : 0.45, ease: EDITORIAL_EASE }}
    >
      <div
        ref={deck.scroll?.connect}
        data-testid="landing-scroll-viewport"
        style={{
          position: "absolute",
          inset: 0,
          overflowY: paused ? "hidden" : "auto",
          overflowX: "hidden",
          overscrollBehaviorY: "contain",
          scrollbarWidth: "none",
          overflowAnchor: "none",
        }}
      >
        <div style={{ height: height + (deck.scroll?.range ?? 0), position: "relative" }}>
          <div
            style={{
              position: "sticky",
              top: 0,
              height,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
