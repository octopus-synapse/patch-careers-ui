# apps/web — Frontend Conventions

The web app is a SvelteKit 2.58 client-side-only app (`ssr: false`) that
consumes the kubb-generated SDK from `@packages/api-client`. The driving
principle is **frontend burro**: the backend is the single source of
truth for shapes, validation rules, error messages, and pagination
envelopes. The frontend renders state and forwards user actions — it
does not re-decide rules.

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

## Auth

- `useAuth()` em `lib/state/auth.svelte.ts` é o ponto único de auth.
  Não acesse `Session200` diretamente.

## Pending decisions

Decisões de produto não resolvidas vivem em
`/FASE3-PENDENCIAS.md` na raiz do monorepo (PD-001 … PD-009). Não
implemente especulativamente — log uma nova PD-xxx.
