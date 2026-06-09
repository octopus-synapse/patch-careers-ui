# Arquitetura — patch-careers-ui

> Documento vivo. Define as convenções **normativas** do monorepo. Decisões com trade-off
> têm um ADR dedicado em [`docs/adr/`](./docs/adr/). Mudou uma convenção? Atualize aqui **e**
> registre/atualize o ADR correspondente.

Palavras-chave **DEVE** / **NÃO DEVE** / **PODE** seguem o sentido usual de norma.

---

## 1. Visão geral

Monorepo **Nx + pnpm** com uma stack universal **Expo Router + React Native + RN Web + Tamagui**.

- `apps/client` — a aplicação (rotas, providers, navegação, features).
- `packages/*` — código compartilhado e infraestrutura.

A app é onde o produto vive. Pacotes existem para código com **2+ consumidores reais**
(rule of three) — ver [ADR-0002](./docs/adr/0002-feature-first-architecture.md).

---

## 2. Camadas e direção de dependência

A dependência **DEVE** fluir em uma única direção. Nenhuma seta volta pra cima.

```
apps/client/app  (rotas · providers · navigation)
        │
        ▼
apps/client/features/*        ← lógica de produto
        │
        ▼
@patch-careers/ui             ← apresentação compartilhada
        │
        ▼
@patch-careers/tokens         ← design tokens (folha; não importa ninguém)

Infraestrutura (lateral — usada pelas camadas acima, nunca o inverso):
@patch-careers/{api-client · auth · state · storage · i18n · platform}
```

Regras duras:
- `tokens` **NÃO DEVE** importar nenhum outro pacote do workspace.
- `ui` **NÃO DEVE** importar `features`, `api-client`, `auth` nem código da app.
- `features` **PODEM** usar `ui` + infraestrutura, mas **NÃO DEVEM** importar de outra feature
  por caminho interno (só via barrel — ver §6).
- `api-client`/`auth`/`state`/`storage`/`i18n` são infra: **não** dependem de `features` nem da app.

Enforcement em [ADR-0003](./docs/adr/0003-module-boundaries-enforcement.md).

---

## 3. Estrutura de diretórios

```
apps/client/src/
  app/            # rotas Expo Router (convenção do framework — ver §4)
  providers/      # React context providers (auth, i18n, tamagui, query)
  navigation/     # redirects, guards, rotas nomeadas
  components/     # componentes da app NÃO compartilháveis (acoplados ao app)
  config/         # configuração da app (api, env)
  features/<feat> # features (ver §5)

packages/
  tokens/  i18n/  storage/  state/  platform/   # infra base
  api-client/  auth/                            # infra de dados/sessão
  ui/                                           # design system (primitives/compounds/editorial)
```

### 3.1 Colocação de componentes (rule of three)

Um componente reusado em **2+ lugares** e **genérico** (depende só de `ui`/`tokens`/RN)
vai pra `@patch-careers/ui`; reusado em 1 lugar ou acoplado a app/feature/infra fica em
`apps/client/src/components/`. Auditoria de 2026-06-09: todos os componentes app-local estão
corretamente colocados — `resume-preview` fica no app por depender de `@patch-careers/api-client`
(mover violaria as camadas), `confirm-dialog`/`global-search-bar` têm 1 consumidor cada, e
`placeholder-screen` se sobrepõe ao `EmptyState` que o `ui` já expõe. Nada a migrar.

---

## 4. Convenções de naming

Tudo é **kebab-case** no sistema de arquivos. O **identificador exportado** mantém a
convenção da linguagem (PascalCase p/ componentes, camelCase p/ funções/hooks).
Ver [ADR-0001](./docs/adr/0001-kebab-case-naming.md).

| Tipo | Arquivo | Export | Exemplo |
|---|---|---|---|
| Diretório | kebab-case | — | `features/messages`, `api-client` |
| Componente `.tsx` | kebab-case | PascalCase | `app-header.tsx` → `export function AppHeader` |
| Hook `.ts` | kebab-case | camelCase | `use-inbox.ts` → `export function useInbox` |
| Helper/lib `.ts` | kebab-case | camelCase | `handle-auth-api-error.ts` |
| Tipos | `types.ts` | — | `features/messages/types.ts` |
| Teste | `*.spec.ts` (colocado) | — | `lib/sort-messages.spec.ts` |
| Barrel | `index.ts` | — | `features/messages/index.ts` |

**Exceção — rotas Expo Router** (`apps/client/src/app/**`): a convenção é ditada pelo
framework e **NÃO DEVE** ser alterada: `sign-in.tsx`, `_layout.tsx`, `[id].tsx`, `(grupo)/`.
Arquivos de rota multi-palavra já são kebab.

---

## 5. Template de feature

Toda feature **DEVE** seguir este esqueleto. Pastas vazias são omitidas até serem necessárias,
mas a posição de cada coisa é fixa:

```
features/<feature>/
  index.ts        # API pública — ÚNICO ponto de import externo (§6)
  types.ts        # tipos de domínio da feature
  components/      # apresentação (kebab / export PascalCase)
  hooks/          # use-*.ts — dados (wrappers React Query) e comportamento
  lib/            # helpers puros, validação, mappers (+ *.spec.ts colocado)
  model/          # (opcional) store escopado / máquina de estado da feature
```

Limite feature ↔ rota: arquivos em `app/` são **wrappers finos** que instanciam a feature.
A lógica vive na feature, não na rota.

---

## 6. Fronteiras: barrels e cross-feature

- Cada feature e cada pacote expõe sua **API pública via `index.ts`**.
- Imports **de fora** de uma feature **DEVEM** passar pelo barrel
  (`@/features/messages`), nunca por um caminho interno (`@/features/messages/lib/x`).
- Dentro da própria feature, imports relativos curtos são permitidos.
- Compartilhou algo entre 2+ features? Promova p/ um pacote (rule of three), não crie
  import cross-feature.

---

## 7. Estado (regra de 3 camadas)

Ver [ADR-0004](./docs/adr/0004-state-management.md). A pergunta nunca é "qual lib", é
**"qual o escopo e o dono do estado"**.

| Estado | Ferramenta | Regra |
|---|---|---|
| Server (vem/volta do backend) | **React Query** | O cache é a fonte da verdade. **NÃO** copiar dado de servidor p/ Zustand/`useState`. Mutation invalida a query. |
| Global / persistente de cliente | **Zustand** | Só o que vários pontos desconexos precisam, sobrevive ao unmount, ou persiste (auth, color-scheme, locale, consent). |
| Local / efêmero | **`useState`/`useReducer`** | Dono é um componente; morre no unmount (dropdown aberto, aba ativa, hover). |
| Forms | **React Hook Form + Zod** | Estado de form é gerenciado por RHF, não por Zustand. |

Teste de uma linha: *"alguém de fora precisa, ou tem que sobreviver ao unmount?"* → Zustand ·
*"vem do servidor?"* → React Query · senão → local (RHF se for form).

Caso de fronteira — estado compartilhado num subtree porém efêmero (ex.: rascunho do wizard
entre steps) → **Zustand escopado** (store criado para o fluxo, descartado ao sair).

---

## 8. Data fetching

- A app consome o backend via **hooks gerados pelo Kubb** em `@patch-careers/api-client`.
- Cada feature **DEVE** envolver esses hooks em **wrappers finos** (`hooks/use-*.ts`) que
  centralizam: `enabled`, polling, e invalidação de cache. Componentes consomem o wrapper,
  não o hook gerado direto. (Padrão atual; ex.: `features/messages/hooks/use-inbox.ts`.)

---

## 9. Forms

Ver [ADR-0005](./docs/adr/0005-forms-rhf-zod.md). Forms **DEVEM** usar **React Hook Form**
com `zodResolver`, reaproveitando os schemas Zod gerados pelo Kubb. Os campos do DS editorial
são integrados via `Controller` (wrappers em `@patch-careers/ui` ou `@patch-careers/forms`).

---

## 10. Imports

- Dentro da app, usar o alias **`@/`** → `apps/client/src/` (sem `../../../`).
- Pacotes são importados por seu nome: `@patch-careers/ui`, `@patch-careers/api-client`, etc.
- Ver [ADR-0006](./docs/adr/0006-path-alias-imports.md).

---

## 11. Enforcement

- **Naming**: Biome `style/useFilenamingConvention` (`kebab-case`), com `overrides`
  ignorando `apps/client/src/app/**` (rotas Expo).
- **Camadas**: Biome `noRestrictedImports` via `overrides` por diretório + tags Nx
  (`scope:*`, `type:*`) para o grafo/`nx affected` e um check de CI. Ver
  [ADR-0003](./docs/adr/0003-module-boundaries-enforcement.md).
- **Commits**: pre-commit roda `biome check .` + `nx run-many -t typecheck`. Nenhum commit
  pode introduzir estado quebrado. `--no-verify` é proibido.

---

## Índice de ADRs

| ADR | Decisão |
|---|---|
| [0001](./docs/adr/0001-kebab-case-naming.md) | Naming kebab-case (arquivo) + export idiomático |
| [0002](./docs/adr/0002-feature-first-architecture.md) | Arquitetura feature-first + template + barrel público |
| [0003](./docs/adr/0003-module-boundaries-enforcement.md) | Camadas estritas + enforcement (Biome + Nx, sem ESLint) |
| [0004](./docs/adr/0004-state-management.md) | Regra de estado de 3 camadas |
| [0005](./docs/adr/0005-forms-rhf-zod.md) | Forms com React Hook Form + Zod |
| [0006](./docs/adr/0006-path-alias-imports.md) | Alias de import `@/` na app |
