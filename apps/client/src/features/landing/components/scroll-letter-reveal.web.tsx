import { type MotionValue, motion, useTransform } from "framer-motion";
import { Fragment, type ReactElement } from "react";
import { letterRevealProgress, type RevealLetter } from "../lib/letter-reveal";

interface ScrollLetterRevealProps {
  readonly words: readonly (readonly RevealLetter[])[];
  readonly count: number;
  readonly progress: MotionValue<number>;
}

/** Each glyph has its own scroll interval; the full line never fades in as a group. */
export function ScrollLetterReveal({
  words,
  count,
  progress,
}: ScrollLetterRevealProps): ReactElement {
  return (
    <>
      {words.map((word) => (
        <Fragment key={word[0]?.index}>
          <span
            // @style-allow inline: a semantic span needs an unbroken inline-block for per-letter motion
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          >
            {word.map((letter) => (
              <ScrollLetter key={letter.index} letter={letter} count={count} progress={progress} />
            ))}
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

function ScrollLetter({
  letter,
  count,
  progress,
}: {
  readonly letter: RevealLetter;
  readonly count: number;
  readonly progress: MotionValue<number>;
}): ReactElement {
  const reveal = useTransform(progress, (p) => letterRevealProgress(p, letter.index, count));
  // Future glyphs must not paint at all, including on the first frame and on reverse.
  const visibility = useTransform(reveal, (value) => (value > 0 ? "visible" : "hidden"));
  const y = useTransform(reveal, [0, 1], ["0.18em", "0em"]);
  const filter = useTransform(reveal, [0, 1], ["blur(3px)", "blur(0px)"]);
  return (
    <motion.span
      data-testid="landing-manifesto-letter"
      data-letter-index={letter.index}
      style={{ display: "inline-block", visibility, opacity: reveal, y, filter }}
    >
      {letter.text}
    </motion.span>
  );
}
