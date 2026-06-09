# ADR-0003 — Camadas estritas e enforcement de fronteiras (Biome + Nx, sem ESLint)

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

Nada impedia uma dependência na direção errada (ex.: `ui` importar `api-client`, ou um ciclo
entre features). Queremos camadas estritas (`app → features → ui → tokens`, infra lateral) com
enforcement automatizado no CI — não só documentado.

O enforcement clássico do Nx (`@nx/enforce-module-boundaries`) é uma regra **ESLint**. Mas o
projeto adotou **Biome como linter/formatter único** (sem ESLint, sem Prettier) e queremos
manter isso.

## Decisão

- **Direção de dependência** documentada em `ARCHITECTURE.md` §2.
- **Enforcement de camadas** via **Biome `noRestrictedImports`** em `overrides` por diretório
  (ex.: em `packages/ui/**`, proibir importar `@patch-careers/api-client`, `@patch-careers/auth`
  e `@/features/*`).
- **Tags Nx** (`scope:*`, `type:*`) nos projetos alimentam o grafo (`nx graph`, `nx affected`)
  e um check de CI tag-aware como backstop.
- **Naming** enforçado por Biome `style/useFilenamingConvention`.

## Alternativas consideradas

- **Reintroduzir ESLint só para `@nx/enforce-module-boundaries`**: rejeitado — fere a decisão
  de "Biome único" e adiciona uma segunda toolchain de lint. Reconsiderar só se o
  `noRestrictedImports` por path se mostrar insuficiente (ele é menos granular que tags).
- **Só documentar (sem ferramenta)**: rejeitado — depende de disciplina, não escala.

## Consequências

- Fronteiras quebram o CI, não só a revisão.
- `noRestrictedImports` é path-based (menos granular que tags Nx); cobre a direção de camadas
  bem, mas regras tag-a-tag finas ficam no check de grafo Nx.
- Sem segunda toolchain de lint.
