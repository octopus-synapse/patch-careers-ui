# ADR-0008 — Tokens de design obrigatórios (sem cor hardcoded)

- **Status**: Aceito
- **Data**: 2026-06-29

## Contexto

`@patch-careers/tokens` é a folha do grafo de camadas (ADR-0003) e expõe a paleta editorial
(light/dark) + escalas. Mesmo assim a auditoria achou 34 cores hardcoded (`#hex`/`rgb()`) no
produto, fora dos tokens — fonte de divergência de tema (claro/escuro) e de drift visual.

## Decisão

1. **Cores no produto vêm de `@patch-careers/tokens`** (ou da `useEditorialPalette()` que as
   resolve por tema). Proibido literal `#hex` / `rgb()/rgba()` em `apps/client/src`.
2. **Spec** `no-hardcoded-color` (parte do `style-detector.ts`), zero-tolerância, com o mesmo
   escape `// @style-allow color: <reason>` para casos genuínos (ex.: tint calculado pontual).
   **Isento**: valor de `shadowColor` — sombra não é uma cor de superfície/texto temada e os
   tokens não a modelam (a paleta editorial não tem cor de sombra).
3. Espaçamento/radius numérico **devem** preferir tokens quando houver um equivalente; valores
   `0`/`1` (hairline) e one-offs justificados ficam livres (não enforçado nesta passada para
   evitar ruído — foco em cor).

## Alternativas consideradas

- **Enforçar spacing/radius numérico já**: adiado — muitos paddings são pontuais e a regra teria
  alto ruído; cor é o ganho de maior sinal (correção de tema claro/escuro).
- **Allowlist de cores "neutras" (preto/branco)**: rejeitado — o ponto é justamente roteá-las
  pelo token de tema; exceções reais usam a diretiva.

## Consequências

- Tema claro/escuro fica correto por construção (a cor resolve pelo token).
- Drift de paleta é barrado quando a spec fica verde (migração em lotes, ADR-0007).
