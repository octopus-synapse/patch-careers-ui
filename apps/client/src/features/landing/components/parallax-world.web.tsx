import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import type { ReactElement } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { useSharedMotionValue } from "../hooks/use-shared-motion-value.web";
import { CONTROL_SPRING, EDITORIAL_EASE } from "../lib/motion-presets";
import { chapterPosition } from "../lib/parallax-math";
import { CHAPTERS } from "../model/chapters";
import { useLandingSequence } from "../model/landing-variants";
import type { WorldProps } from "./parallax-world";

/** Quiet, scroll-linked light and two fine orbital lines leave the copy room to breathe. */
export function ParallaxWorld({
  motion: landing,
  width,
  height,
  index,
  position,
}: WorldProps): ReactElement {
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const chapter = CHAPTERS[index];
  const color =
    accents[chapter?.accent === "ink" ? "indigo" : (chapter?.accent ?? "indigo")].accent;
  const compact = width < 1024;
  const scroll = useSharedMotionValue(position, 0);
  const pointerX = useSharedMotionValue(landing.x, 0);
  const pointerY = useSharedMotionValue(landing.y, 0);
  const x = useTransform(() =>
    landing.reduced ? 0 : Math.sin(scroll.get() * 0.5) * 22 + pointerX.get() * 8,
  );
  const y = useTransform(() =>
    landing.reduced ? 0 : Math.cos(scroll.get() * 0.5) * 16 + pointerY.get() * 6,
  );
  const rotate = useTransform(() => (landing.reduced ? -24 : -24 + scroll.get() * 3));
  const diameter = compact ? width * 1.25 : Math.min(640, width * 0.44);
  return (
    <div
      data-testid="landing-parallax-world"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: chapter?.key === "cta" ? 0 : 1,
        color,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: compact ? 0.12 : 0.18,
          backgroundImage: `radial-gradient(${palette.subtle} 0.6px, transparent 0.6px)`,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to right, transparent, black)",
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          width: diameter * 1.8,
          height: diameter * 1.8,
          left: width * (compact ? 0.85 : 0.76) - diameter * 0.9,
          top: height * 0.48 - diameter * 0.9,
          x,
          y,
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: chapter?.spectacle ? 0.065 : 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: landing.reduced ? 0 : 0.9, ease: EDITORIAL_EASE }}
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse, ${color}, transparent 68%)`,
            }}
          />
        </AnimatePresence>
      </motion.div>
      {compact ? null : (
        <motion.div
          animate={{ opacity: chapter?.spectacle ? 0.12 : 0.36 }}
          transition={{ duration: landing.reduced ? 0 : 0.7 }}
          style={{
            position: "absolute",
            width: diameter,
            height: diameter,
            left: width * 0.76 - diameter / 2,
            top: height * 0.48 - diameter / 2,
            x,
            y,
            rotate,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 600 600" fill="none" aria-hidden="true">
            <title> </title>
            <circle
              cx="300"
              cy="300"
              r="266"
              stroke="currentColor"
              strokeWidth="0.7"
              opacity="0.32"
            />
            <ellipse
              cx="300"
              cy="300"
              rx="235"
              ry="280"
              stroke="currentColor"
              strokeWidth="0.6"
              opacity="0.22"
              transform="rotate(32 300 300)"
            />
            <motion.path
              key={landing.reduced ? "static" : "animated"}
              d="M 300 34 A 266 266 0 0 1 566 300"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.55"
              initial={{ pathLength: landing.reduced ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: landing.reduced ? 0 : 1.7,
                delay: landing.reduced ? 0 : 0.6,
                ease: EDITORIAL_EASE,
              }}
            />
            <circle cx="300" cy="34" r="3" fill="currentColor" opacity="0.7" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}

const EMPTY_HEIGHTS: number[] = [];

export function ScrollJourney({
  offset,
  heights,
  motion: landing,
  width,
  index,
  onNext,
}: Omit<WorldProps, "height"> & { readonly onNext: () => void }): ReactElement {
  const { chapters } = useLandingSequence();
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const color = accents[chapters[index]?.accent ?? "indigo"].accent;
  const next = chapters[index + 1];
  const scroll = useSharedMotionValue(offset, 0);
  const sizes = useSharedMotionValue(heights, EMPTY_HEIGHTS);
  const scaleX = useTransform(
    () => (chapterPosition(scroll.get(), sizes.get()) + 1) / chapters.length,
  );
  return (
    <div
      style={{ position: "absolute", bottom: 0, left: 0, right: 0, pointerEvents: "none", color }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: width >= 1024 ? "0 40px 20px" : "0 24px 20px",
          fontFamily: editorialFonts.mono,
          fontSize: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, color }}>
          <span
            style={{ display: "inline-grid", overflow: "hidden", height: 18, fontSize: 12, color }}
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={index}
                initial={{ y: landing.reduced ? 0 : 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: landing.reduced ? 0 : -12, opacity: 0 }}
                transition={{ duration: landing.reduced ? 0 : 0.3, ease: EDITORIAL_EASE }}
              >
                {String(index + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </span>
          <span style={{ color: palette.subtle }}>/ {chapters.length}</span>
        </div>
        <div style={{ width: 32, height: 1, background: palette.hairline }} />
        {next ? (
          <motion.button
            type="button"
            onClick={onNext}
            aria-label={t("landing.a11y.goToChapter", { title: t(`landing.rail.${next.key}`) })}
            initial="rest"
            whileHover="hover"
            whileTap={{ y: landing.reduced ? 0 : 1 }}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 0",
              color: palette.muted,
              background: "transparent",
              border: 0,
              font: "inherit",
              cursor: "pointer",
            }}
          >
            {t(`landing.rail.${next.key}`)}
            <motion.span
              variants={{ rest: { y: 0 }, hover: { y: landing.reduced ? 0 : 3 } }}
              transition={CONTROL_SPRING}
              style={{ color, fontSize: 16 }}
            >
              ↓
            </motion.span>
          </motion.button>
        ) : null}
      </div>
      <div style={{ height: 1, background: palette.hairline }}>
        <motion.div
          data-testid="landing-scroll-progress"
          style={{ height: 1, background: color, scaleX, transformOrigin: "left" }}
        />
      </div>
    </div>
  );
}
