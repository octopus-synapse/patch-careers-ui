import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { LayoutGroup, motion } from "framer-motion";
import { type ReactElement, useId, useState } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { useLandingMotionContext } from "../hooks/use-landing-motion";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { CONTROL_SPRING } from "../lib/motion-presets";
import { CHAPTERS } from "../model/chapters";
import type { ChapterRailProps } from "./chapter-rail";

/** A quiet index that opens on hover or keyboard focus; one spring moves the active marker. */
export function ChapterRail({ index, onSelect }: ChapterRailProps): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const reduced = useLandingMotionContext()?.reduced ?? true;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <motion.nav
        aria-label={t("landing.a11y.chapters")}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        animate={{
          width: expanded ? 184 : 34,
          backgroundColor: expanded ? palette.panel : "transparent",
        }}
        transition={reduced ? { duration: 0 } : CONTROL_SPRING}
        style={{
          position: "absolute",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 50,
          padding: "14px 8px",
          borderRadius: 20,
          boxSizing: "border-box",
          color: palette.ink,
        }}
      >
        {CHAPTERS.map((chapter, at) => {
          const active = at === index;
          const color = accents[chapter.accent].accent;
          const title = t(`landing.rail.${chapter.key}`);
          return (
            <motion.a
              key={chapter.key}
              href={`#${chapter.key}`}
              aria-label={t("landing.a11y.goToChapter", { title })}
              aria-current={active ? "step" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onSelect(at);
              }}
              whileHover={{ color: palette.ink }}
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                height: 27,
                textDecoration: "none",
                borderRadius: 4,
                color: active ? palette.ink : palette.muted,
              }}
            >
              <motion.span
                animate={{ opacity: expanded || active ? 1 : 0, x: expanded || active ? 0 : 5 }}
                transition={{ duration: reduced ? 0 : 0.22 }}
                style={{
                  position: "absolute",
                  right: 26,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  fontFamily: editorialFonts.sans,
                  fontSize: 12,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {title}
              </motion.span>
              <span
                style={{
                  position: "relative",
                  width: 16,
                  height: 20,
                  display: "grid",
                  placeItems: "center",
                  color,
                }}
              >
                <motion.span
                  animate={{ opacity: active ? 0 : expanded ? 0.45 : 0.25 }}
                  style={{ width: 3, height: 3, borderRadius: 99, background: palette.muted }}
                />
                {active ? (
                  <motion.span
                    {...(reduced ? {} : { layoutId: "active-chapter" })}
                    transition={CONTROL_SPRING}
                    data-testid="landing-active-chapter-marker"
                    style={{
                      position: "absolute",
                      width: 4,
                      height: 16,
                      borderRadius: 99,
                      background: color,
                    }}
                  />
                ) : null}
              </span>
            </motion.a>
          );
        })}
      </motion.nav>
    </LayoutGroup>
  );
}
