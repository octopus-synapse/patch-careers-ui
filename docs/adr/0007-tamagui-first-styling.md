# ADR-0007 — Estilo Tamagui-first (sem StyleSheet/inline estático no produto)

- **Status**: Aceito
- **Data**: 2026-06-29

## Contexto

A convenção "use Tamagui, não StyleSheet" existia só como texto (CLAUDE.md) e não era
verificada. Uma auditoria achou **103 violações** em código de produto: 32 `StyleSheet.create`,
37 `style={{…}}` inline estático e 34 cores hardcoded. O próprio DS (`packages/ui`) usa
`StyleSheet` em 10 arquivos — legítimo para animação/medição.

## Decisão

1. **Produto (`apps/client/src`) estiliza via Tamagui props + tokens.** Proibido:
   - `StyleSheet.create` (use styled props);
   - `style={{…}}` cujo **todos** os valores são literais estáticos (use props). Um `style`
     com valor **dinâmico/computado** (`insets.top`, valor animado) é permitido — é o caso
     legítimo do RN, que o Tamagui não cobre bem.
2. **DS (`packages/ui`) PODE usar `StyleSheet`** para animação/medição/controle preciso,
   anotado com a diretiva. O detector de estilo só varre o produto.
3. **Escape**: `// @style-allow <kind>: <reason>` (`stylesheet`/`inline`/`color`), reason
   obrigatório, parser único em `style-directives.ts`.
4. **Enforcement**: spec `no-stylesheet-inline-styles.spec.ts` + `style-detector.ts` (TS
   compiler API), zero-tolerância.
5. **Rollout**: migração **concluída** (103 → 0 violações, em lotes verificados por
   typecheck+lint). A spec está **verde e gateada** no `verify:arch` (pre-commit + CI). As
   exceções legítimas (factories de estilo temadas consumidas via `style` prop, modais
   animados, hosts não-Tamagui como `iframe`/`WebView`/`ScrollView`, cores intencionais
   scrim/sombra/marca) ficam anotadas com a diretiva — visíveis e auditáveis.

## Alternativas consideradas

- **Banir StyleSheet também no DS**: rejeitado — animações (Reanimated) e medições precisam do
  escape do RN; forçar tudo no Tamagui reescreveria animações sem ganho.
- **Baseline congelado**: rejeitado — preferimos zero-tolerância com migração em lotes (mesmo
  padrão da migração i18n já em curso), sem arquivo de baseline a manter.

## Consequências

- Estilo novo no produto nasce Tamagui; regressão é barrada quando a spec fica verde.
- A migração é incremental e verificável (typecheck+lint+app por lote).
- Exceções legítimas ficam visíveis e justificadas no código.
