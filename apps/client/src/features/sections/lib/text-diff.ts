/**
 * Word-level diff between two strings — what the rewrite review shows so a
 * person can see exactly what the machine changed in their other-language
 * copy. Plain LCS over whitespace-separated tokens; the inputs are a few
 * sentences, so the quadratic table is nothing.
 */

export type DiffSegment = { kind: "same" | "added" | "removed"; text: string };

function tokens(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

export function diffWords(before: string, after: string): DiffSegment[] {
  const a = tokens(before);
  const b = tokens(after);
  const n = a.length;
  const m = b.length;
  // lcs(i, j) = length of the LCS of a[i..] and b[j..], on a flat table so
  // every read is a plain number (no nested-array "maybe undefined").
  const width = m + 1;
  const table = new Array<number>((n + 1) * width).fill(0);
  const lcs = (i: number, j: number): number => table[i * width + j] ?? 0;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j] ? lcs(i + 1, j + 1) + 1 : Math.max(lcs(i + 1, j), lcs(i, j + 1));
    }
  }
  const out: DiffSegment[] = [];
  const push = (kind: DiffSegment["kind"], text: string): void => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i] as string);
      i++;
      j++;
    } else if (lcs(i + 1, j) >= lcs(i, j + 1)) {
      push("removed", a[i] as string);
      i++;
    } else {
      push("added", b[j] as string);
      j++;
    }
  }
  while (i < n) push("removed", a[i++] as string);
  while (j < m) push("added", b[j++] as string);
  return out;
}

/** True when the two texts differ once whitespace runs are normalised. */
export function textsDiffer(before: string, after: string): boolean {
  return before.replace(/\s+/g, " ").trim() !== after.replace(/\s+/g, " ").trim();
}

/** A field value as the diff sees it: strings as-is, string arrays joined by newlines. */
export function fieldText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join("\n");
  return "";
}

/** The inverse of `fieldText` for array fields: one entry per non-empty line. */
export function fieldValueFromText(text: string, wasArray: boolean): string | string[] {
  if (!wasArray) return text;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
