# ADR-0005 — Forms com React Hook Form + Zod

- **Status**: Aceito
- **Data**: 2026-06-09

## Contexto

Onboarding e profile usavam estado de form manual (muitos `useState` + mapas de erro
hand-rolled), com validação duplicada entre `components/auth/validation.ts` e
`features/sections/validation.ts`. O CLAUDE.md já previa um pacote `@patch-careers/forms`
(createForm + zodResolver) — RHF + Zod sempre foi a direção pretendida.

## Decisão

Forms **DEVEM** usar **React Hook Form** com `@hookform/resolvers` (`zodResolver`),
reaproveitando os schemas Zod gerados pelo Kubb (`@patch-careers/api-client`). Os campos do
DS editorial são integrados via `Controller`, com wrappers reutilizáveis.

## Alternativas consideradas

- **Manter hand-rolled**: rejeitado — boilerplate alto, validação duplicada, sem padrão.
- **Outra lib de forms** (Formik etc.): rejeitado — RHF já era o alvo documentado e tem melhor
  performance em RN (menos re-renders).

## Consequências

- Validação unificada nos schemas Zod (fonte única, alinhada ao backend via Kubb).
- Menos re-renders e menos código por form.
- Migração incremental de auth/profile/sections/onboarding (fase pesada do refactor).
