# ADR-0009 — Adoção do `@patch-careers/ui` verificada (anti re-implementação)

- **Status**: Aceito
- **Data**: 2026-06-29

## Contexto

O DS (`@patch-careers/ui`) expõe primitives/compounds/editorial, mas a "rule of three"
(ARCHITECTURE.md §3.1) e a adoção do DS eram só convenção textual. Uma auditoria achou código de
produto reimplementando coisas que o DS já provê — ex.: separadores hairline soltos
(`<View style={{ height: 1, backgroundColor }} />`) em 6 lugares em vez do `Divider`.

## Decisão

1. **Código de produto usa o DS, não o reimplementa.** Onde o DS expõe um elemento, importe-o.
   O DS (`packages/ui`) é a única camada que constrói esses primitives a partir do RN cru.
2. **Enforcement via spec** `apps/client/src/static-analysis/ui-adoption.spec.ts`
   (+ `ui-adoption-detector.ts`), TS-compiler-API, zero-tolerância. Regras de baixo
   falso-positivo:
   - `touchable` — proibido importar `Touchable*` do `react-native` no produto (use `Pressable`
     ou o DS `Button`).
   - `divider` — proibido hairline inline (`<View style={{ height|width: 1, backgroundColor }} />`);
     use o DS `Divider` (`color` + `marginLeft`/`marginRight`).
3. **Escape explícito**: `// @style-allow <kind>: <reason>` (parser único em `style-directives.ts`,
   compartilhado com as regras de estilo do ADR-0007). Reason obrigatório.
4. **Colocação (rule of three)**: presentacional genérico reusado por 2+ → `@patch-careers/ui`;
   reusado por 1 ou acoplado a app/feature/infra → `apps/client/src/components/`.

## Alternativas consideradas

- **Detector genérico de "re-implementação"** (qualquer componente que pareça um do DS): rejeitado
  — alto falso-positivo. Preferimos um conjunto pequeno e curado de regras de alto sinal, que cresce
  sob demanda.
- **Banir todos os primitives RN (`Text`/`View`) no produto**: rejeitado nesta passada — `Text`
  aparece em ~33 arquivos e a migração p/ DS/Tamagui é tratada junto da migração de estilo
  (ADR-0007), nos mesmos arquivos.

## Consequências

- Reimplementar um elemento do DS quebra o CI.
- O `Divider` ganhou `marginLeft`/`marginRight` p/ cobrir o caso de inset (sem reabrir hairlines soltas).
- A lista de regras é curada e extensível; novas adoções viram novas regras no detector.
