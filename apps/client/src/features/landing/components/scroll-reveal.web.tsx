import { type MotionValue, motion, useTransform } from "framer-motion";
import type { CSSProperties, ReactElement, ReactNode } from "react";

interface ScrollRevealProps {
  readonly children: ReactNode;
  /** 0 is fully concealed, 1 is fully readable. No autonomous playback. */
  readonly progress: MotionValue<number>;
  readonly testId?: string;
  readonly block?: boolean;
  readonly style?: CSSProperties;
}

/** A single text layer lifts through a fixed mask and comes into focus. */
export function ScrollReveal({
  children,
  progress,
  testId,
  block = false,
  style,
}: ScrollRevealProps): ReactElement {
  const y = useTransform(progress, [0, 1], ["112%", "0%"]);
  const opacity = useTransform(progress, [0, 0.18, 1], [0, 1, 1]);
  const filter = useTransform(progress, [0, 1], ["blur(7px)", "blur(0px)"]);
  const rotateX = useTransform(progress, [0, 1], [18, 0]);
  return (
    <span
      data-scroll-reveal-mask="true"
      style={{
        display: block ? "block" : "inline-block",
        overflow: "clip",
        verticalAlign: "bottom",
        padding: "0.08em 0.1em 0.18em",
        margin: "-0.08em -0.1em -0.18em",
        ...style,
      }}
    >
      <motion.span
        data-testid={testId}
        style={{
          display: "inline-block",
          y,
          opacity,
          filter,
          rotateX,
          transformPerspective: 1000,
          transformOrigin: "50% 100%",
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
