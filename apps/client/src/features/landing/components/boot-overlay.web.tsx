import { brandPiecePalettes } from "@patch-careers/tokens";
import { useEditorialPalette, useThemeName } from "@patch-careers/ui/editorial";
import { AnimatePresence, motion } from "framer-motion";
import { type ReactElement, useEffect, useState } from "react";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { landingSound } from "../lib/landing-sound";
import { EDITORIAL_EASE } from "../lib/motion-presets";
import { PUZZLE_PATHS } from "../lib/puzzle-paths";

/** A brief brand signature, then a soft dissolve into the first headline. */
export function BootOverlay(): ReactElement {
  const palette = useEditorialPalette();
  const colors = brandPiecePalettes[useThemeName()];
  const reduced = useLandingMotionContext()?.reduced ?? true;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (reduced) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(false);
      landingSound.play("pop");
    }, 650);
    return () => clearTimeout(timer);
  }, [reduced]);
  return (
    <AnimatePresence>
      {visible && !reduced ? (
        <motion.div
          data-testid="landing-boot-overlay"
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.38, ease: EDITORIAL_EASE }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            background: palette.bg,
          }}
        >
          <svg width="72" height="72" viewBox="-20 -20 340 340" aria-hidden="true">
            <title> </title>
            {PUZZLE_PATHS.map((path, at) => (
              <motion.path
                key={path}
                d={path}
                fill={at ? colors.indigo : colors.plain}
                initial={{ x: at ? 26 : -26, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.08, ease: EDITORIAL_EASE }}
              />
            ))}
          </svg>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
