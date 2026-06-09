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
- Migração incremental de auth/profile/sections.

## Escopo — o que NÃO usa RHF (e por quê)

- **Onboarding `StepForm`**: o draft do wizard vive no Zustand escopado por
  decisão de arquitetura ([ADR-0004](./0004-state-management.md) — persiste entre
  steps). RHF (estado de form local por step) criaria duas fontes de verdade, então
  o `StepForm` continua store-backed/controlado. O editor de itens de seção
  (`SectionItemEditor`) **usa** RHF no form do modal por-item — o store guarda a
  lista, não o draft de um item.
- **OTP de campo único** (`2fa-verify`, `verify-email`): RHF não agrega para um
  único campo com `OtpInput` próprio — ficam como estão.
