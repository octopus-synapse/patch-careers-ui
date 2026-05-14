# Idea — Composer intent auto-detect

Status: backlog, not started.

The post composer currently makes the user explicitly pick an attachment
type (image / poll / code) via toggle buttons. The shape of the input
already tells us most of the time. The composer should read what the
user does and pre-toggle the right attachment without asking.

## Triggers and actions

| User action | Auto behaviour |
|---|---|
| Pastes a URL whose host is `github.com/<owner>/<repo>` | Suggest an attachment chip "📎 Anexar repo" — clicking fetches repo metadata (description, primary language, star count) and renders an embedded preview card alongside the linkUrl. |
| Pastes any other URL | Detect via regex on input, fire an OG preview fetch in the background, render a collapsible link-preview card below the textarea. |
| Types ` ``` ` (three backticks) followed by a language tag | Open the Código attachment automatically, pre-fill `codeLanguage` from the tag, and drop the user's cursor inside the code textarea. Closing ` ``` ` removes the chunk from the main `content` and stores it under `codeSnippet`. |
| Pastes an image from clipboard (Ctrl/Cmd+V with image data) | Open the Imagem attachment, upload the image directly via `postV1PostsUploadImage`, render the preview tile. No need to click the image button. |
| Drag-drops an image file | Same as clipboard paste. |
| Types or pastes 3 or more skill keywords that match the skills catalog (`React`, `TypeScript`, `PostgreSQL`, ...) | Render clickable hashtag suggestion chips beneath the footer ("Adicionar #react · #typescript · #postgres"). Click adds to `hashtags[]` and appends to content. |
| Pastes a poll-shaped block (`/poll` slash-command, or `- A\n- B\n- C` markdown list with ≥2 items at top of input) | Open the Poll attachment, prefill the options from the bullets, keep the question above as `content`. |

## Why it matters

The current composer makes the user think twice: type the message, then
remember to also click the right attachment toggle. The intent is almost
always inferable from the input itself. Saving that one click per post
compounds heavily — the friction tax on posting is what keeps most
career-focused social products quiet.

## Implementation notes (for whoever picks this up)

- The `onpaste` / `onbeforeinput` events on `<Textarea>` give us the raw
  input. Listen there, not on `input`, so we can also catch clipboard
  image data via `event.clipboardData.items`.
- The URL detection regex already exists in `lib/utils/linkify.ts` —
  reuse `URL_RE` there for consistency.
- GitHub repo metadata: there's already a github-import flow in
  `profile-services/.../bounded-contexts/import/.../github-import.service.ts`.
  Likely there's a public-repo endpoint we can reuse for the preview,
  or fall back to GitHub's REST API (rate-limited but adequate for
  preview-only).
- The skills catalog is exposed via `/v1/skills` (or similar) — cache
  the keyword set client-side on first composer open, scan the textarea
  content on each keystroke (debounced).
- OG previews: there's a `SafeFetchPort` server-side that handles SSRF
  protection. The frontend can hit a new `POST /v1/feed/link-preview`
  endpoint that proxies the OG fetch with that port. Don't fetch directly
  from the browser — CORS will block most domains anyway.
- Poll-by-bullets: regex match `^[-*]\s+(.+)$` on consecutive lines at
  the top of the text. If ≥2 matches, treat the part before the bullets
  as the question.

## Out of scope

- Don't try to detect "this is a job posting" and auto-redirect to
  `/recruiting/jobs/new`. Job posts are a separate flow now; the
  feed composer should never feel like a wizard.
- Don't auto-translate or auto-correct text. Tone hinting (idea #18 in
  the brainstorm doc) is a separate, opt-in feature.

## Related ideas (from the 20-idea brainstorm)

- #17 — Ghost-text co-writer (AI-suggested next clause as faded inline
  text, Tab to accept).
- #18 — Tone meter + "make it crisper" rewrite.
- #20 — Single-emoji "pulse" post.
