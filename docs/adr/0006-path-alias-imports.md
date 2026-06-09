# ADR-0006 — Alias de import `@/` na app

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

A app usava imports relativos profundos (`../../../components/...`), frágeis a moves de arquivo
e ruidosos. Os renames/moves deste refactor agravariam o problema.

## Decisão

Dentro de `apps/client`, usar o alias **`@/`** → `apps/client/src/`. Pacotes do workspace são
importados por nome (`@patch-careers/ui`, etc.). Imports relativos ficam restritos ao interior
de uma mesma feature (caminhos curtos).

Configuração: `paths` em `tsconfig.base.json`/`tsconfig.app.json`, resolver no
`metro.config.js` e babel da app. `typedRoutes` do Expo Router permanece funcionando.

## Alternativas consideradas

- **Sempre relativo**: rejeitado — `../../../` frágil a moves.
- **Relativo dentro da feature + alias fora**: parcialmente adotado — relativo curto é permitido
  dentro da feature; cruzou fronteira, usa alias/pacote.

## Consequências

- Imports estáveis a moves; codemod de renames fica mais simples.
- Exige manter o alias sincronizado entre tsconfig + metro + babel.
