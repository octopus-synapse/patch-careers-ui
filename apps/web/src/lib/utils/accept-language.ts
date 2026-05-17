// RFC-7231 Accept-Language parser.
//
// The previous ad-hoc parser in hooks.server.ts split on "," then dropped
// everything after ";", which meant:
//   - q-values were ignored ("pt-BR;q=0.1, en;q=0.9" picked pt-BR first
//     even though the user clearly preferred English),
//   - duplicate weights weren't tie-broken by original order,
//   - malformed entries (missing q, "q=abc", "q=2") weren't rejected.
// RFC 7231 §5.3.1 says q ranges 0..1, default 1, three decimal max; q=0
// means "do not use".
//
// Returns tags sorted by quality desc, original order preserved on ties.
// Caller decides how to map each tag to its set of supported locales.

export type AcceptLanguageEntry = { tag: string; quality: number };

export function parseAcceptLanguage(header: string): AcceptLanguageEntry[] {
  if (!header) return [];
  const out: Array<AcceptLanguageEntry & { idx: number }> = [];
  const parts = header.split(',');
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i]?.trim();
    if (!raw) continue;
    const [tagPart, ...paramParts] = raw.split(';');
    const tag = tagPart?.trim();
    if (!tag) continue;
    let quality = 1;
    for (const param of paramParts) {
      const trimmed = param.trim();
      if (!trimmed.toLowerCase().startsWith('q=')) continue;
      const numStr = trimmed.slice(2);
      const parsed = Number.parseFloat(numStr);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) continue;
      quality = parsed;
    }
    if (quality === 0) continue;
    out.push({ tag, quality, idx: i });
  }
  out.sort((a, b) => b.quality - a.quality || a.idx - b.idx);
  return out.map(({ tag, quality }) => ({ tag, quality }));
}
