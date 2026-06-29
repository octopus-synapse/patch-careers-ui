# ADR-0010 — Foundation features e enforcement de fronteira cross-feature

- **Status**: Aceito
- **Data**: 2026-06-29

## Contexto

O ADR-0002 proíbe import horizontal entre features (só via promoção a pacote). O ADR-0003
enforça **camadas** por nome de package via Biome `noRestrictedImports`, mas reconhece que
`noRestrictedImports` é path-based e **não expressa o grafo de features** ("feature A não importa
feature B"). Na prática, uma auditoria encontrou ~17 imports cross-feature: a feature `sections`
(editor de seções de currículo) e `resumes` são consumidas por `onboarding` e `profile`.

Promover **tudo** que é compartilhado para packages é caro: `sections`/`resumes` carregam domínio
acoplado a `@patch-careers/api-client`, então não cabem em `@patch-careers/ui` (que não pode
depender da camada de dados — ADR-0003). Já os bits **presentacionais genéricos** que vinham
sendo cross-importados (cards, rows, screen shell) cabem no DS.

## Decisão

1. **Presentacional genérico → `@patch-careers/ui`** (depende só de `ui`/`tokens`/RN). Componente
   acoplado a router/i18n mas reusado por 2+ features → `apps/client/src/components/` (ADR/§3.1).
   Ex.: `SettingsCard`/`SettingsRow` foram pro DS; `SettingsScreenShell` pro `components/`.
2. **Foundation features**: um conjunto pequeno e explícito de features de **domínio
   compartilhado** PODE ser importado por outras features. Hoje: **`sections` + `resumes`**
   (o domínio "currículo"). Qualquer outra feature→feature é proibida.
3. **Imports cross-feature/external passam pelo barrel** (`@/features/<x>`), nunca por caminho
   interno (deep-import), reafirmando ADR-0002 §6.
4. **Enforcement**: como `noRestrictedImports` não modela o grafo, a regra vai num **spec de
   static-analysis** (`apps/client/src/static-analysis/architecture-detector.ts` +
   `no-cross-feature-imports.spec.ts`), no mesmo padrão TS-compiler-API do detector de i18n.
   `FOUNDATION_FEATURES` é a allowlist única; ampliar a permissão = editar esse Set
   conscientemente.

## Alternativas consideradas

- **Zero cross-feature (tudo vira package)**: rejeitado nesta passada — `@patch-careers/sections`
  seria um package feature-like acoplado a api-client, refactor pesado sem ganho proporcional.
- **Reintroduzir ESLint + `@nx/enforce-module-boundaries`** (tags `type:feature`/foundation):
  rejeitado — fere "Biome único" (ADR-0003). O spec cobre a granularidade que faltava.
- **Permitir `settings` como foundation**: rejeitado — só o domínio currículo é genuinamente
  compartilhado; o chrome de settings é presentacional → DS/`components/`.

## Consequências

- Acoplamento horizontal quebra o CI (spec zero-tolerância), não só a revisão.
- A lista de foundation features é visível e auditável num único lugar.
- Promover presentacional ao DS reforça a adoção do `@patch-careers/ui` (ADR-0009).
- Trade-off aceito: foundation features são uma exceção pragmática à "rule of three estrita";
  mantê-las poucas é parte da disciplina.
