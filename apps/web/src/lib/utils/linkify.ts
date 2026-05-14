/**
 * Render plain post text as XSS-safe HTML with:
 *   - http(s) URLs converted to clickable blue anchors
 *   - hashtags (`#word`) styled in blue
 *
 * We escape every character first and then inject markup by replacing
 * the already-escaped substrings — so user content can never break out
 * of the resulting HTML. Result is consumed via `{@html}` in the card.
 */

const URL_RE = /\bhttps?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/gi;
const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

export function renderRichText(content: string): string {
  if (!content) return '';
  let html = escapeHtml(content);

  html = html.replace(URL_RE, (raw) => {
    const href = escapeAttr(raw);
    const label = escapeHtml(raw.replace(/^https?:\/\//, ''));
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${label}</a>`;
  });

  html = html.replace(HASHTAG_RE, (raw) => {
    return `<span class="text-blue-500">${escapeHtml(raw)}</span>`;
  });

  return html;
}
