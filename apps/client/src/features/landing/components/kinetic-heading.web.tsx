import { editorialFonts, useEditorialPalette } from "@patch-careers/ui/editorial";
import { type MotionValue, motion, useTransform } from "framer-motion";
import { Fragment, type ReactElement } from "react";
import { useChapterMotion } from "../hooks/use-chapter-motion.web";
import type { KineticHeadingProps } from "./kinetic-heading.types";

/** Masked word reveals share a scroll value and settle on an exact, readable baseline. */
export function KineticHeading({
  lead,
  second,
  emphasis,
  tail,
  accent,
  size,
  maxWidth = 900,
  centered = false,
  breakAfterLead = false,
  variant,
}: KineticHeadingProps): ReactElement {
  const palette = useEditorialPalette();
  const { travel, intro, reduced, compact, index } = useChapterMotion();
  const reveal = useTransform(() =>
    reduced
      ? 0
      : Math.max(intro.get(), Math.min(1, Math.max(0, Math.abs(travel.get()) - 0.22) / 1.03)),
  );
  const Tag = variant === "hero" ? "h1" : "h2";
  const segments = [
    { key: "lead", text: lead, emphasis: false, lineBreak: breakAfterLead },
    { key: "second", text: second, emphasis: false },
    { key: "emphasis", text: emphasis, emphasis: true },
    { key: "tail", text: tail, emphasis: false },
  ];
  let wordIndex = 0;
  return (
    <Tag
      data-kinetic-heading={index}
      aria-label={[lead, second, emphasis, tail].filter(Boolean).join(" ")}
      style={{
        margin: 0,
        maxWidth,
        fontFamily: editorialFonts.serif,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -size * 0.018,
        color: palette.ink,
        fontWeight: 400,
        textAlign: centered ? "center" : "left",
      }}
    >
      {segments
        .filter((segment) => segment.text)
        .map((segment) => (
          <Fragment key={segment.key}>
            {segment.text?.split(/\s+/).map((word, at) => {
              const order = wordIndex++;
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: translated words can repeat within a fixed sentence
                <Fragment key={`${segment.key}-${at}`}>
                  <HeadingWord
                    word={word}
                    order={order}
                    reveal={reveal}
                    size={size}
                    compact={compact}
                    color={segment.emphasis ? accent : palette.ink}
                    italic={segment.emphasis}
                  />{" "}
                </Fragment>
              );
            })}
            {segment.lineBreak ? <br aria-hidden="true" /> : null}
          </Fragment>
        ))}
    </Tag>
  );
}

function HeadingWord({
  word,
  order,
  reveal,
  size,
  compact,
  color,
  italic,
}: {
  readonly word: string;
  readonly order: number;
  readonly reveal: MotionValue<number>;
  readonly size: number;
  readonly compact: boolean;
  readonly color: string;
  readonly italic: boolean;
}): ReactElement {
  const progress = useTransform(reveal, (value) =>
    Math.min(1, value * (1 + Math.min(order, 12) * 0.075)),
  );
  const y = useTransform(progress, (value) => value * size * (compact ? 0.45 : 0.72));
  const opacity = useTransform(progress, [0, 0.65, 1], [1, 0.7, 0]);
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        overflow: "clip",
        verticalAlign: "bottom",
        padding: "0.08em 0.08em 0.16em",
        margin: "-0.08em -0.08em -0.16em",
        color,
      }}
    >
      <motion.span
        style={{ display: "inline-block", y, opacity, fontStyle: italic ? "italic" : "normal" }}
      >
        {word}
      </motion.span>
    </span>
  );
}
