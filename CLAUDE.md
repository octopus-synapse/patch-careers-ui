# patch-careers-ui (V2) — Agent guidelines

Este monorepo foi reescrito na V2 pra uma stack universal Expo + RN Web + Tamagui gerenciada por **Nx + pnpm**. Bun, Turbo e SvelteKit foram removidos no big-bang cutover (D49). Não os reintroduza.

## Arquitetura & convenções

Doc normativo: **[ARCHITECTURE.md](./ARCHITECTURE.md)** + ADRs em **[docs/adr/](./docs/adr/)**. Todo código novo DEVE seguir:

- **Naming kebab-case** no sistema de arquivos; export idiomático (componente `app-header.tsx` → `AppHeader`; hook `use-inbox.ts` → `useInbox`; helper `handle-auth-api-error.ts`). Testes `*.spec.ts` colocados. Rotas Expo em `app/**` seguem o framework (`_layout.tsx`, `[id].tsx`, `(grupo)/`). (ADR-0001)
- **Feature-first**: features vivem em `apps/client/src/features/*` com template fixo (`index.ts` · `types.ts` · `components/` · `hooks/` · `lib/` · `model/` opcional). `index.ts` é a **API pública** — imports de fora da feature passam só pelo barrel. (ADR-0002)
- **Camadas estritas**: `app → features → @patch-careers/ui → @patch-careers/tokens`; infra (`api-client`/`auth`/`state`/`storage`/`i18n`/`platform`) é lateral. Nenhuma seta volta pra cima. Enforçado por Biome `noRestrictedImports` + tags Nx. (ADR-0003)
- **Estado**: server → React Query (cache é a fonte da verdade); global/persistente → Zustand; efêmero → `useState`/`useReducer`; forms → RHF+Zod. (ADR-0004/0005)
- **Imports**: alias `@/` → `apps/client/src/`; pacotes do workspace por nome. (ADR-0006)
- **Pacote só com 2+ consumidores** (rule of three).

## Package manager: pnpm

- Use `pnpm install` (NUNCA `bun install` / `npm install` / `yarn install`)
- Use `pnpm <script>` (NUNCA `bun run <script>` / `npm run <script>`)
- Use `pnpm dlx <package>` (NUNCA `bunx` / `npx`)
- Use `pnpm add -Dw <pkg>` pra deps root, `pnpm --filter <name> add <pkg>` pra deps de package específico
- Workspaces declarados em `pnpm-workspace.yaml` (`apps/*` + `packages/*`)
- `pnpm-lock.yaml` é canônico — sempre commitar quando deps mudam

## Build orchestration: Nx

- Targets: `pnpm nx run <project>:<target>` ou `pnpm nx run-many -t <target>`
- Comuns: `lint`, `typecheck`, `test`, `build`
- Cache local automático (`.nx/cache`). Veja graph com `pnpm nx graph`
- `nx.json` usa **Crystal inference** — plugins (@nx/expo, @nx/js, @nx/react) detectam targets dos `project.json` automaticamente, evita boilerplate
- Pra criar packages novos: `pnpm nx g @nx/js:lib <name>` (não cria manualmente)
- Pra criar app Expo: `pnpm nx g @nx/expo:app <name>` (planejado pro PR #6)
- Affected (CI): `pnpm nx affected -t lint typecheck test`

## TypeScript

- Strict máximo: `strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + noImplicitOverride + verbatimModuleSyntax`
- Base config em `tsconfig.base.json` na raiz. Cada package estende
- `verbatimModuleSyntax` exige `import type { ... }` explícito pra types — não confie em elision automática
- Não use `any`. Não use `// @ts-ignore`/`// @ts-expect-error` sem comentário explicando o porquê

## Linter/Formatter: Biome

- `pnpm lint` ou `pnpm nx run-many -t lint`
- Config em `biome.json` (root). Ignora `.nx/`, `.expo/`, `dist/`, `tmp/`, `node_modules/`
- Sem ESLint, sem Prettier

## Testes

- **Unit/integration**: Vitest + MSW (D37-D38). NÃO use `bun test`, NÃO use Jest
- **E2E mobile**: Maestro (planejado pro PR #20). YAML em `apps/client/.maestro/`
- **E2E web universal**: Playwright (planejado pro PR #20)
- Coverage threshold: lines 70%, branches 60% (D39, enforcer em CI)

## Stack do app (chegará nos PRs seguintes)

- **Expo Router** + React Native + react-native-web (universal: iOS + Android + Web)
- **Tamagui** core + babel plugin (compiler ahead-of-time, NÃO StyleSheet inline) — sem styled-components, sem CSS-in-JS runtime
- **Zustand** + zustand persist (state universal)
- **React Hook Form + zodResolver** (forms)
- **TanStack React Query** + Kubb-generated SDK (data fetching)
- **expo-secure-store** + react-native-mmkv (storage; adapter em `@patch-careers/storage`)
- **Sentry** (errors + perf + session replay) + **PostHog** (analytics + LGPD)

## Packages planejados em `packages/`

1. `@patch-careers/tokens` — design tokens Tamagui (PR #4)
2. `@patch-careers/i18n` — translator + format Intl (PR #4)
3. `@patch-careers/storage` — adapter Platform.OS (PR #4)
4. `@patch-careers/state` — Zustand stores universais (PR #4)
5. `@patch-careers/api-client` — Kubb-generated SDK + auth client (PR #5)
6. `@patch-careers/auth` — token-based auth client (PR #5)
7. `@patch-careers/ui` — componentes Tamagui custom (PR #8)
8. `@patch-careers/forms` — createForm + zodResolver helpers (PR #15 ou antes)

## Monorepo wiring com o backend

- **Backend muda primeiro**. Mudou rota/shape/validação em `profile-services`? Rode lá `bun run swagger:generate` (backend ainda usa Bun) + `bun run contracts:export` (gera `dictionaries.json` + `enums.json` + `error-codes.json` — adicionado no PR #3 do V2)
- **Sync automático**: CI workflow `_sync-contracts.yml` abre PR no patch-careers-ui rodando `pnpm sdk:generate` quando os artefatos mudam (PR #3)
- **Kubb plugin**: `@kubb/plugin-react-query` (NÃO svelte-query)
- **Drift detection**: pre-commit hook falha se `client-swagger.json` mudou sem regen
- **Spectral diff em CI** detecta breaking changes (PR #3)

## Auth flow universal

- **Bearer token universal** (mobile + web) desde o dia 1 (D17)
- Header `Accept-Mode: tokens` no `POST /v1/auth/login` (PR #2 backend já suporta)
- Refresh: interceptor automático no api-client (queue pra evitar N refresh paralelos)
- Storage: refresh token em `@patch-careers/storage` secure (expo-secure-store mobile, secure cookie web)
- OAuth: `expo-auth-session` + deep link `patchcareers://auth/callback` (backend `redirect_uri` allowlist via env `OAUTH_REDIRECT_URI_ALLOWLIST` — PR #2)

## Conventions

- **NUNCA** `style="..."` ou `<style>` em componente React Native — use Tamagui styled props ou tokens. (Equivalente da regra antiga "no inline style" do Svelte)
- **NUNCA** rotas de `apps/web` (SvelteKit) reaparecem — esse repo é Expo agora
- **Componente reused em 2+ rotas** → vai pra `packages/ui`. Reused em 1 → fica no `apps/client/src/components/` (rule of three)
- **Adicione comentário** só quando o "porquê" é não-óbvio. WHAT já está no código

## Decisões e plano

- 161 decisões da V2: `../../../_bmad-output/v2-decisions.md` (relative ao monorepo) ou caminho absoluto `/home/enzoferracini/Documents/Projects/patch-careers/_bmad-output/v2-decisions.md`
- Plano dos 20 PRs: `../../../_bmad-output/v2-plan.md`
- Memórias do usuário: ver memórias persistentes (CLAUDE.md ~/.claude/projects/-home-enzoferracini-Documents-Projects-patch-careers/memory/MEMORY.md)

## Pre-push/pre-commit hooks

- Husky + commitlint mantidos
- Hooks rodam lint + typecheck + tests afetados
- `--no-verify` proibido (memória registrada)
- Não commitar `Co-Authored-By: Claude` trailer (memória registrada)
- Não passar `-c user.name/user.email` (memória registrada)
