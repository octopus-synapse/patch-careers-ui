/**
 * `useTypewriter` — the demo's `type()`: reveals `text` one character at a
 * time, `msPerChar` apart, once `run` turns true. Resets when `text` changes
 * or `run` drops back to false, so a replayed scene starts clean.
 */

import { useEffect, useState } from "react";

export function useTypewriter(text: string, msPerChar: number, run: boolean): string {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    if (!run || text.length === 0) return;
    const started = performance.now();
    let frame = 0;
    const tick = (): void => {
      const shown = Math.min(
        text.length,
        Math.floor((performance.now() - started) / msPerChar) + 1,
      );
      setCount(shown);
      if (shown < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, msPerChar, run]);

  return text.slice(0, count);
}

/** The demo's `bin()`: each character as 8-bit binary, space-separated. */
export function toBinary(text: string): string {
  return [...text].map((ch) => ch.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}
