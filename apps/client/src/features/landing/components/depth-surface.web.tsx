import { motion, useMotionTemplate, useSpring, useTransform } from "framer-motion";
import { type PointerEvent, type ReactElement, useEffect } from "react";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { SURFACE_SPRING } from "../lib/motion-presets";
import type { DepthSurfaceProps } from "./depth-surface";

/** Damped pointer response and a soft light contained to the card's surface. */
export function DepthSurface({ children, maxWidth }: DepthSurfaceProps): ReactElement {
  const reduced = useLandingMotionContext()?.reduced ?? true;
  const accents = useLandingAccents();
  const x = useSpring(0, SURFACE_SPRING);
  const y = useSpring(0, SURFACE_SPRING);
  const glow = useSpring(0, SURFACE_SPRING);
  const rotateX = useTransform(y, [-0.5, 0.5], [1.8, -1.8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-1.8, 1.8]);
  const lightX = useTransform(x, (value) => (value + 0.5) * 100);
  const lightY = useTransform(y, (value) => (value + 0.5) * 100);
  const background = useMotionTemplate`radial-gradient(440px circle at ${lightX}% ${lightY}%, ${accents.indigo.accent}, transparent 70%)`;
  useEffect(() => {
    if (!reduced) return;
    x.jump(0);
    y.jump(0);
    glow.jump(0);
  }, [reduced, x, y, glow]);
  const move = (event: PointerEvent<HTMLDivElement>): void => {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(
      Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5)),
    );
    y.set(
      Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5)),
    );
    glow.set(0.065);
  };
  const reset = (): void => {
    x.set(0);
    y.set(0);
    glow.set(0);
  };
  return (
    <div data-depth-surface onPointerMove={move} onPointerLeave={reset} style={{ maxWidth }}>
      <motion.div
        data-testid="landing-depth-plane"
        style={{
          position: "relative",
          borderRadius: 20,
          transformPerspective: 1200,
          rotateX,
          rotateY,
        }}
      >
        {children}
        <motion.div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: glow,
            background,
          }}
        />
      </motion.div>
    </div>
  );
}
