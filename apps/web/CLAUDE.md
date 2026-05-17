# apps/web — Frontend Conventions

The web app is a SvelteKit 2.58 app that **defaults to SSR** (`ssr: true`
in the root `+layout.ts`) and consumes the kubb-generated SDK from
`@packages/api-client`. The driving principle is **frontend burro**: the
backend is the single source of truth for shapes, validation rules, error
messages, and pagination envelopes. The frontend renders state and
forwards user actions — it does not re-decide rules.

## SSR doctrine

- **Default = SSR on.** The root `+layout.ts` exports `ssr = true`. Every
  route is rendered server-side unless it opts out.
- **Opt out per route** with `export const ssr = false;` in the route's
  own `+layout.ts` / `+page.ts` when the leaf is intrinsically client-only
  (depends on `localStorage`, draws on a `<canvas>`, needs `window` before
  paint, etc.).
- **SEO-critical routes** (landing, jobs detail, feed post permalink,
  public profile, sitemap.xml) MUST stay SSR — the previous CSR-only
  default made them invisible to crawlers and added a 200-300ms blank
  shell before the first paint.
- **State that depends on auth cookies** still works with SSR: the SDK
  fetcher forwards the cookie from the SvelteKit `event.fetch`. Loads
  that branch on `useAuth()` need to gate on `browser` from
  `$app/environment`.

> Historical note: this app used to default to `ssr: false` and rely on
> per-route opt-in. Inverted in the P0 sweep — see `BUG_REPORT.md` #24.

These conventions were established across Fase 1 (audit), Fase 2 (SDK
adoption), Fase 3 (cleanup). When a convention conflicts with what the
code does today, the convention wins — the divergent code is on the
migration path.

---

## API access

- **All HTTP** goes through the generated SDK in `api-client`. Use
  `createGetV1*` / `createPostV1*` (TanStack Query hooks) for reactive
  data and `getV1*` / `postV1*` (plain client functions) for one-shot
  imperative calls (analytics, onboarding multipart).
- **No `fetch()` direct** in `apps/web/src`. Exceptions: `+server.ts`
  SSR endpoints (sitemap.xml) and admin dev-tools intended to probe
  raw HTTP. If you need a new endpoint, add it in `profile-services`,
  regenerate the SDK (`bun run sdk:generate`), then consume it.
- **Locale propagation**: the fetcher injects `Accept-Language` from the
  `locale` cookie (`packages/api-client/src/client/fetcher.ts`).
  Mensagens de erro chegam prontas do backend. NÃO traduza no frontend.

## Error handling

- Mensagens de erro vêm prontas via `err.message`. Use
  `isApiError(err) && serverError = err.message` no `onError`.
- Para fallback de rede / `err` não-`Error`, use `t('errors.network')` —
  é a única chave de erro mantida em `@packages/i18n`. As outras (16+
  chaves `errors.*` e `auth.shared.error*`) foram removidas — não
  reintroduza.

## Forms

- Use `createForm({ schema })` em `lib/state/create-form.svelte.ts`.
- Schema vem do SDK gerado: `import { xxxMutationRequestSchema } from 'api-client/zod'`.
- Não escreva zod manual em forms. Regras de email/password vivem em
  `shared-kernel/schemas/primitives` no backend e propagam via
  regeneração do SDK.

## Pagination

- **Envelope** (Q1): respostas paginadas chegam como
  `{items, total, page, limit, totalPages, hasNext, hasPrev}`. Não
  acesse campos antigos (`.skills`, `.users`, `.comments`) — sempre
  `.items`.
- **Query**: `page`/`limit`/`pageSize` são `number` no SDK gerado. Não
  passe strings (`"1"`, `"20"`).
- Para infinite-scroll, use `useInfiniteList` em
  `lib/state/use-infinite-list.svelte.ts`.
- Para extrair `page`/`limit` de uma `URL` (paginação acompanhada na
  URL), use `pageParams(url)` em `lib/utils/page-params.ts`. Retorna
  `{page, limit}` com defaults clamped 1..100.

## Domain alias files

Tipos de domínio compartilhados pelas páginas estão re-exportados via
arquivos curados em `lib/types/`:

- `lib/types/social.ts` — feed posts, comments, network connections.
- `lib/types/jobs.ts` — job postings, applications, fit-profile.
- `lib/types/resumes.ts` — resumes, versions, shares.
- `lib/types/feed.ts` — feed-specific composite types.

Importe do alias em vez de `GetV1XxxYyy200['items'][number]` direto.
O alias absorve mudanças do SDK regen sem espalhar `as any`.

## Locale

- Single source of truth: `LOCALES = ['en', 'pt-BR']` de `@packages/i18n`.
- `locale.set(value)` em `lib/state/locale.svelte.ts` grava cookie +
  atualiza store reactive. Próximo request inclui `Accept-Language`
  corrigido automaticamente.

## SDK regen workflow

1. Mudou algo no backend (`profile-services`)? Rode `bun run swagger:generate`.
2. Em `packages/api-client`, `bun run sdk:generate` (regrava
   `.swagger-hash`).
3. `bun run check` em `apps/web` para validar.
4. Commit. Pre-commit `sdk-drift` hook impede commit com SDK desatualizado.

## Drift gate

- `packages/api-client/src/generated/.swagger-hash` armazena o sha256
  do `profile-services/client-swagger.json` no momento do último
  `sdk:generate`.
- `scripts/check-sdk-drift.sh` (rodado pelo pre-commit como check
  `sdk-drift`) compara o hash atual com o stored e falha o commit
  quando o swagger mudou mas o SDK não foi regenerado.
- O comando para destravar é sempre `cd packages/api-client && bun run
  sdk:generate` — o script já reescreve o hash junto com os arquivos
  gerados, então um único re-run resolve.
- Para empurrar mudanças locais sem que o pre-push silencie isso, o
  hook `.husky/pre-push` repete os mesmos checks. `--no-verify` é
  considerado erro de processo, não atalho.

## Auth

- `useAuth()` em `lib/state/auth.svelte.ts` é o ponto único de auth.
  Não acesse `Session200` diretamente.

## E2E test users

Helpers em `test/infrastructure/e2e/_helpers/auth.ts`. Pick the one
whose user-state matches the assertion you're writing — don't
re-build a context from `signupTestUser` for state the seed already
provides.

| Helper                                  | User state                       | When to use                                   |
|-----------------------------------------|----------------------------------|-----------------------------------------------|
| `loginAs(., STANDARD_USER_CREDENTIALS)` | verified + onboarded + resume    | post-onboarding feature tests (enzo)          |
| `loginAs(., ADMIN_CREDENTIALS)`         | admin                            | admin-only routes / permission bypass         |
| `loginAs(., E2E_USER_CREDENTIALS)`      | verified + onboarded, no resume  | feature tests that don't need a resume row    |
| `loginAsUnonboardedUser(browser)`       | verified, NOT onboarded          | onboarding stepper specs                      |
| `signupUnverifiedUser(browser)`         | fresh, unverified                | verify-email gate specs                       |
| `signupTestUser({...})` (raw)           | fresh, no BrowserContext         | tests of the signup flow itself               |

Rich JSDoc lives on each export — hover in your editor for the long
form (which gate each one bypasses, when NOT to use, example
invocation). The seeds these reference are in
`profile-services/prisma/seeds/*.seed.ts`.

## Primitives & state factories (PR2)

Estabelecidos na PR2 (Waves 2.1–2.5). Use ao invés de reescrever o
padrão sem-helper.

- **`<LinkButton href>`** (`packages/ui/src/components/link-button/`)
  — substitui `<Button onclick={() => goto(...)}>` para hrefs
  conhecidos. Renderiza `<a>`, então SSR/middle-click/copy-link
  funcionam. SvelteKit ainda intercepta in-app pra navegação CSR.
- **`<ConfirmModal>`** (`packages/ui/src/components/modal/confirm-modal`)
  — substitui `confirm()` nativo. Pattern: `let candidate = $state(...)`,
  `requestX()` seta, `confirmX()` consome no `onConfirm`. Dark-mode +
  focus-trap saem de graça. Veja `admin/users/+page.svelte` como ref.
- **`useMeDashboard()`** (`lib/state/me-dashboard.svelte.ts`) — store
  context-based, NÃO singleton. Provider é `setMeDashboardStore()` no
  root `+layout.svelte`. Não importe singleton anterior.
- **`secureStorage`** (`lib/utils/secure-storage.svelte`) — wrapper de
  `localStorage` com namespace `secure:<userId>:<key>`. Use sempre que
  estiver guardando PII ou drafts de formulário. Auto-limpa no logout
  (navbar + delete-account) e em qualquer 401 que a SDK retornar (via
  `setUnauthorizedHandler` em `+layout.svelte`).

## Pending decisions

Decisões de produto não resolvidas vivem em
`/FASE3-PENDENCIAS.md` na raiz do monorepo (PD-001 … PD-009). Não
implemente especulativamente — log uma nova PD-xxx.
