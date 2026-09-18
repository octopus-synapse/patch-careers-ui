import { brandPiecePalettes } from "@patch-careers/tokens";
import {
  BrandMark,
  editorialFonts,
  useEditorialPalette,
  useThemeName,
} from "@patch-careers/ui/editorial";
import { type MotionValue, motion, useTransform } from "framer-motion";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import { useI18n } from "@/providers/i18n-provider";
import { useChapterMotion } from "../hooks/use-chapter-motion.web";
import { useLandingAccents } from "../hooks/use-landing-palettes";
import { connectionBeats, manifestoBeats, revealBetween } from "../lib/cinema-math";
import { splitRevealLetters } from "../lib/letter-reveal";
import { PUZZLE_PATHS } from "../lib/puzzle-paths";
import type { ChapterContentProps } from "./chapter-content";
import { ScrollLetterReveal } from "./scroll-letter-reveal.web";
import { ScrollReveal } from "./scroll-reveal.web";

type SceneProgress = {
  readonly progress: MotionValue<number>;
  readonly compact: boolean;
};
const center: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function SpectacleChapter({ chapter, width }: ChapterContentProps): ReactElement {
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const palette = useEditorialPalette();
  const { progress, compact } = useChapterMotion();
  const key = `landing.cinema.${chapter.key}`;
  const opacity = useTransform(progress, (p) =>
    chapter.key === "connection"
      ? connectionBeats(p).caption
      : chapter.key === "manifesto"
        ? manifestoBeats(p).caption
        : revealBetween(p, 0.9, 1),
  );
  const y = useTransform(opacity, [0, 1], [8, 0]);
  return (
    <section
      data-testid={`landing-spectacle-${chapter.key}`}
      aria-label={t(`${key}.eyebrow`)}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        color: palette.ink,
        isolation: "isolate",
      }}
    >
      {chapter.key === "manifesto" ? (
        <Manifesto progress={progress} compact={compact} />
      ) : chapter.key === "versions" ? (
        <Versions progress={progress} compact={compact} />
      ) : (
        <Connection progress={progress} compact={compact} />
      )}
      <motion.p
        data-testid="landing-cinema-caption"
        style={{
          position: "absolute",
          bottom: compact ? 92 : "11%",
          left: 28,
          right: 28,
          margin: 0,
          textAlign: "center",
          fontFamily: editorialFonts.sans,
          color: palette.muted,
          fontSize: compact ? 14 : 16,
          opacity,
          y,
        }}
      >
        {t(`${key}.caption`)}
      </motion.p>
    </section>
  );
}

function SceneTitle({
  children,
  compact,
  style,
  label,
}: {
  readonly children: ReactNode;
  readonly compact: boolean;
  readonly style?: CSSProperties;
  readonly label?: string;
}): ReactElement {
  return (
    <h2
      aria-label={label}
      style={{
        margin: 0,
        textAlign: "center",
        fontFamily: editorialFonts.serif,
        fontWeight: 400,
        fontSize: compact ? "clamp(36px, 8.5vw, 64px)" : "clamp(60px, 5.2vw, 94px)",
        lineHeight: 1.1,
        letterSpacing: "-0.035em",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

/** Both lines write themselves one letter at a time, directly from scroll position. */
function Manifesto({ progress, compact }: SceneProgress): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const lead = t("landing.cinema.manifesto.lead");
  const emphasis = t("landing.cinema.manifesto.emphasis");
  const leadLetters = splitRevealLetters(lead);
  const emphasisLetters = splitRevealLetters(emphasis, leadLetters.count);
  const letterCount = leadLetters.count + emphasisLetters.count;
  const cameraY = useTransform(progress, [0, 1], [compact ? 8 : 18, compact ? -6 : -14]);
  const rule = useTransform(progress, (p) => manifestoBeats(p).rule);
  return (
    <>
      <div style={{ ...center, bottom: "6%", padding: compact ? 20 : 36 }}>
        <motion.div style={{ y: cameraY, width: "100%" }}>
          <SceneTitle
            compact={compact}
            label={`${lead} ${emphasis}`}
            style={{
              fontSize: compact ? "clamp(44px, 13vw, 86px)" : "clamp(90px, 9.8vw, 156px)",
              lineHeight: 1.16,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                color: palette.ink,
                fontSize: "0.78em",
                lineHeight: 1.5,
              }}
            >
              <ScrollLetterReveal
                words={leadLetters.words}
                count={letterCount}
                progress={progress}
              />
            </span>
            <em aria-hidden="true" style={{ display: "block", color: accents.indigo.accent }}>
              <ScrollLetterReveal
                words={emphasisLetters.words}
                count={letterCount}
                progress={progress}
              />
            </em>
          </SceneTitle>
        </motion.div>
      </div>
      <div
        style={{
          position: "absolute",
          left: compact ? "10%" : "30%",
          right: compact ? "10%" : "30%",
          bottom: "27%",
          color: palette.muted,
        }}
      >
        <motion.div
          style={{
            height: 1,
            background: palette.hairline,
            scaleX: rule,
            opacity: rule,
            transformOrigin: "50% 50%",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 20,
            gap: compact ? 12 : 24,
            color: palette.muted,
          }}
        >
          {[0, 1, 2].map((at) => (
            <SkillNote key={at} at={at} progress={progress} compact={compact} />
          ))}
        </div>
      </div>
    </>
  );
}

function SkillNote({
  at,
  progress,
  compact,
}: SceneProgress & { readonly at: number }): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const reveal = useTransform(progress, (p) =>
    revealBetween(p, 0.9 + at * 0.015, 0.96 + at * 0.02),
  );
  return (
    <ScrollReveal
      progress={reveal}
      style={{
        fontFamily: editorialFonts.mono,
        fontSize: compact ? 9 : 11,
        color: palette.muted,
        whiteSpace: "nowrap",
      }}
    >
      {t(`landing.cinema.manifesto.skill${at + 1}`)}
    </ScrollReveal>
  );
}

function Versions({ progress, compact }: SceneProgress): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const reveal = useTransform(progress, (p) => revealBetween(p, 0.64, 0.88));
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "23%",
          left: 24,
          right: 24,
          color: palette.ink,
        }}
      >
        <SceneTitle compact={compact}>
          {t("landing.cinema.versions.lead")}
          <em style={{ display: "block", color: accents.mint.accent }}>
            <ScrollReveal progress={reveal} testId="landing-versions-payoff" block>
              {t("landing.cinema.versions.emphasis")}
            </ScrollReveal>
          </em>
        </SceneTitle>
      </div>
      <div aria-hidden="true" style={{ ...center, top: "25%" }}>
        {[0, 2, 1].map((slot) => (
          <ResumePlane key={slot} slot={slot} progress={progress} compact={compact} />
        ))}
      </div>
    </>
  );
}

function ResumePlane({
  slot,
  progress,
  compact,
}: SceneProgress & { readonly slot: number }): ReactElement {
  const { t } = useI18n();
  const { height } = useWindowDimensions();
  const palette = useEditorialPalette();
  const accents = useLandingAccents();
  const color =
    [accents.indigo.accent, accents.mint.accent, accents.blush.accent][slot] ??
    accents.indigo.accent;
  const size = Math.min(compact ? 154 : 238, height * 0.27);
  const sign = slot - 1;
  const fan = useTransform(progress, (p) => revealBetween(p, 0.1, 0.64));
  const x = useTransform(fan, [0, 1], [sign * 12, sign * (compact ? 106 : 262)]);
  const y = useTransform(fan, (p) => Math.abs(sign) * p * 22 - (1 - p) * slot * 4);
  const rotateZ = useTransform(fan, [0, 1], [sign * 2, sign * 7]);
  const rotateY = useTransform(fan, [0, 1], [0, sign * -5]);
  const scale = useTransform(fan, [0, 1], [0.94, slot === 1 ? 1 : 0.96]);
  const line = useTransform(progress, (p) => revealBetween(p, 0.35, 0.9));
  return (
    <motion.article
      data-testid={`landing-resume-plane-${slot}`}
      style={{
        position: "absolute",
        width: size,
        height: size * 1.3,
        zIndex: slot === 1 ? 3 : 1,
        x,
        y,
        rotateZ,
        rotateY,
        scale,
        transformPerspective: 1400,
        padding: compact ? 17 : 25,
        boxSizing: "border-box",
        borderRadius: compact ? 14 : 18,
        border: `1px solid ${palette.hairline}`,
        background: palette.panel,
        boxShadow: `0 16px 40px ${palette.hairline}`,
        fontFamily: editorialFonts.sans,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color,
        }}
      >
        <BrandMark size={compact ? 26 : 36} />
        <span style={{ fontFamily: editorialFonts.mono, fontSize: 9, color }}>0{slot + 1}</span>
      </div>
      <p
        style={{
          fontSize: compact ? 8 : 10,
          color: palette.muted,
          margin: "20px 0 6px",
        }}
      >
        {t("landing.cinema.versions.profile")}
      </p>
      <h3
        style={{
          fontFamily: editorialFonts.serif,
          fontSize: compact ? 20 : 29,
          fontWeight: 400,
          color,
          margin: "0 0 16px",
        }}
      >
        {t(`landing.cinema.versions.role${slot + 1}`)}
      </h3>
      <motion.div
        style={{
          height: 2,
          width: "36%",
          background: color,
          borderRadius: 4,
          marginBottom: 16,
          scaleX: line,
          transformOrigin: "left",
        }}
      />
      {[100, 80, 92, 65].map((w, at) => (
        <div
          key={w}
          style={{
            width: `${w}%`,
            height: 4,
            borderRadius: 4,
            background: palette.subtle,
            opacity: at === slot ? 0.4 : 0.14,
            marginTop: 10,
          }}
        />
      ))}
      <p
        style={{
          fontSize: compact ? 7 : 9,
          color: palette.muted,
          marginTop: 18,
        }}
      >
        {t("landing.cinema.versions.detail")}
      </p>
    </motion.article>
  );
}

function Connection({ progress, compact }: SceneProgress): ReactElement {
  const { t } = useI18n();
  const palette = useEditorialPalette();
  const { height } = useWindowDimensions();
  const colors = brandPiecePalettes[useThemeName()];
  const accents = useLandingAccents();
  const size = Math.min(compact ? 210 : 280, height * 0.32);
  const lead = useTransform(progress, (p) => connectionBeats(p).lead);
  const emphasis = useTransform(progress, (p) => connectionBeats(p).emphasis);
  const rippleOpacity = useTransform(
    progress,
    (p) => Math.sin(connectionBeats(p).ripple * Math.PI) * 0.18,
  );
  const rippleScale = useTransform(progress, (p) => 0.85 + connectionBeats(p).ripple * 0.65);
  return (
    <>
      <div aria-hidden="true" style={{ ...center, bottom: "22%" }}>
        <motion.div
          style={{
            position: "absolute",
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: "50%",
            border: `1px solid ${accents.indigo.accent}`,
            opacity: rippleOpacity,
            scale: rippleScale,
          }}
        />
        {[0, 1].map((part) => (
          <PuzzlePlane
            key={part}
            part={part}
            size={size}
            color={part ? colors.indigo : colors.plain}
            progress={progress}
            compact={compact}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: 24,
          right: 24,
          color: palette.ink,
        }}
      >
        <SceneTitle compact={compact} style={{ fontSize: compact ? "8vw" : "min(4.5vw, 7.5vh)" }}>
          <ScrollReveal progress={lead} testId="landing-connection-lead" block>
            {t("landing.cinema.connection.lead")}
          </ScrollReveal>
          <em style={{ display: "block", color: accents.indigo.accent }}>
            <ScrollReveal progress={emphasis} testId="landing-connection-payoff" block>
              {t("landing.cinema.connection.emphasis")}
            </ScrollReveal>
          </em>
        </SceneTitle>
      </div>
    </>
  );
}

function PuzzlePlane({
  part,
  size,
  color,
  progress,
  compact,
}: SceneProgress & {
  readonly part: number;
  readonly size: number;
  readonly color: string;
}): ReactElement {
  const distance = useTransform(progress, (p) => 1 - connectionBeats(p).approach);
  const sign = part ? 1 : -1;
  const x = useTransform(distance, (p) => sign * p * (compact ? 72 : 150));
  const y = useTransform(distance, (p) => -sign * p * (compact ? 18 : 30));
  const rotateZ = useTransform(distance, (p) => sign * p * 12);
  const rotateY = useTransform(distance, (p) => -sign * p * 16);
  const scale = useTransform(distance, [0, 1], [1, 0.94]);
  return (
    <motion.div
      data-testid={`landing-puzzle-plane-${part}`}
      style={{
        position: "absolute",
        width: size,
        height: size,
        x,
        y,
        rotateZ,
        rotateY,
        scale,
        transformPerspective: 1400,
      }}
    >
      <svg width={size} height={size} viewBox="-6 -6 302 302" aria-hidden="true">
        <title> </title>
        <path d={PUZZLE_PATHS[part]} fill={color} />
      </svg>
    </motion.div>
  );
}
